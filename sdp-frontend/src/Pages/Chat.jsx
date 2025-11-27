import { motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { 
  MessageCircle, 
  Send, 
  Users, 
  Plus, 
  Settings, 
  Search,
  Hash,
  Lock,
  Unlock,
  UserPlus,
  LogOut,
  Wifi,
  WifiOff,
  MoreVertical,
  X,
  Check,
  Copy,
  Eye,
  EyeOff,
  Paperclip,
  Download,
  File,
  Image,
  FileText,
  Video,
  Music,
  Save,
  FolderPlus
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { Client } from "@stomp/stompjs";
import { useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import SharedNavBar from "../components/SharedNavBar";
import config from "../../config";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  
  // UI States
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showFileVisibilityModal, setShowFileVisibilityModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileVisibility, setFileVisibility] = useState("all"); // "all" or "selected"
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [savingToDrive, setSavingToDrive] = useState({}); // Track which files are being saved
  
  // Form States
  const [groupName, setGroupName] = useState("");
  const [groupPassword, setGroupPassword] = useState("");
  const [joinGroupId, setJoinGroupId] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showJoinPassword, setShowJoinPassword] = useState(false);
  
  const fileInputRef = useRef(null);
  
  const messagesEndRef = useRef(null);
  const stompClientRef = useRef(null);
  const activeGroupRef = useRef(null);
  const navigate = useNavigate();
  
  // Keep activeGroupRef in sync with activeGroup
  useEffect(() => {
    activeGroupRef.current = activeGroup;
  }, [activeGroup]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket connection status colors
  const getStatusColor = (status) => {
    switch (status) {
      case "connected": return "text-green-600";
      case "connecting": return "text-yellow-600";
      case "disconnected": return "text-gray-500";
      case "error": return "text-red-600";
      default: return "text-gray-500";
    }
  };

  // Initialize user and fetch groups
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchUserGroups(parsedUser.username);
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        localStorage.removeItem("user");
        navigate("/signin");
      }
    } else {
      toast.error("Please log in to access chat", {
        duration: 4000,
        position: "top-center",
      });
      navigate("/signin");
      return;
    }

    // Cleanup WebSocket on unmount
    return () => {
      if (stompClientRef.current) {
        console.log("🧹 Cleaning up WebSocket connection");
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [navigate]);

  // Fetch user groups
  const fetchUserGroups = async (username) => {
    if (!username) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`${config.url}/api/groups/user/${username}`, {
        headers: {
          ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` })
        }
      });
      setGroups(response.data || []);
      console.log("✅ Groups fetched:", response.data);
    } catch (error) {
      console.error("❌ Error fetching groups:", error);
      toast.error("Failed to fetch groups", {
        duration: 4000,
        position: "top-center",
      });
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
    }

    setConnectionStatus("connecting");
    setIsWebSocketConnected(false);
    
    console.log(`🔌 Connecting WebSocket to ${config.wsUrl}`);

    const client = new Client({
      connectHeaders: {
        Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : undefined
      },
      
      reconnectDelay: 2000,
      maxReconnectAttempts: 5,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      webSocketFactory: () => {
        return new SockJS(config.wsUrl);
      },
      
      debug: (str) => {
        if (process.env.NODE_ENV === 'development') {
          if (str.includes('connected') || str.includes('disconnected') || 
              str.includes('error') || str.includes('reconnect')) {
            console.log("🔌 STOMP:", str);
          }
        }
      },
      
      onConnect: (frame) => {
        console.log(`✅ Successfully connected to WebSocket`);
        setConnectionStatus("connected");
        setIsWebSocketConnected(true);
        
        // Subscribe to all user's groups
        const currentGroups = groups.length > 0 ? groups : (activeGroup ? [activeGroup] : []);
        currentGroups.forEach(group => {
          try {
            const subscription = client.subscribe(`/topic/group/${group.id}`, (message) => {
              console.log("📨 Group message received:", message.body);
              try {
                const data = JSON.parse(message.body);
                console.log("📨 Parsed message data:", data);
                
                // Check file visibility before adding message
                if (data.type === 'file') {
                  try {
                    const fileData = JSON.parse(data.content);
                    const currentUser = user?.username;
                    
                    // If visibility is "selected", check if current user is in visibleTo list
                    if (fileData.visibility === 'selected') {
                      // Always show to sender
                      if (data.senderUsername === currentUser) {
                        // Allow it through
                      } else if (fileData.visibleTo && Array.isArray(fileData.visibleTo)) {
                        // Only show if current user is in visibleTo list
                        if (!fileData.visibleTo.includes(currentUser)) {
                          console.log("🚫 File not visible to current user, skipping");
                          return; // Don't add this message
                        }
                      } else {
                        // No visibleTo list means not visible to anyone except sender
                        if (data.senderUsername !== currentUser) {
                          console.log("🚫 File has no visibleTo list, skipping for non-sender");
                          return;
                        }
                      }
                    }
                    // If visibility is "all", show to everyone (no filtering needed)
                  } catch (e) {
                    // If parsing fails, allow the message (backward compatibility)
                    console.log("⚠️ Could not parse file data, allowing message");
                  }
                }
                
                // Add message if it's for the currently active group
                // Use ref to get current activeGroup value
                const currentActiveGroup = activeGroupRef.current;
                if (currentActiveGroup?.id === group.id || data.groupId === group.id) {
                  setMessages(prev => {
                    // Check if message already exists to avoid duplicates
                    const exists = prev.some(m => m.id === data.id);
                    if (!exists) {
                      console.log("✅ Adding message to state:", data);
                      return [...prev, data];
                    }
                    return prev;
                  });
                  
                  // Show notification if not from current user
                  if (data.senderUsername !== user?.username) {
                    // For file messages, show a different notification
                    if (data.type === 'file') {
                      try {
                        const fileData = JSON.parse(data.content);
                        toast(`📎 ${data.senderUsername} shared a file: ${fileData.fileName}`, {
                          duration: 4000,
                          position: "top-right",
                        });
                      } catch (e) {
                        toast(`📎 ${data.senderUsername} shared a file`, {
                          duration: 4000,
                          position: "top-right",
                        });
                      }
                    } else {
                      toast(`💬 ${data.senderUsername}: ${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}`, {
                        duration: 4000,
                        position: "top-right",
                      });
                    }
                  }
                }
              } catch (parseError) {
                console.error("Parse error:", parseError);
              }
            });
            console.log(`✅ Subscribed to group ${group.id}`);
          } catch (subscribeError) {
            console.error("Failed to subscribe to group:", group.id, subscribeError);
          }
        });
        
        toast.success("✅ Connected to chat!", {
          duration: 3000,
          position: "top-center",
        });
      },
      
      onStompError: (frame) => {
        console.error("❌ STOMP Error:", frame);
        setConnectionStatus("error");
        setIsWebSocketConnected(false);
        toast.error("❌ Chat connection failed", {
          duration: 4000,
          position: "top-center",
        });
      },
      
      onWebSocketError: (error) => {
        console.error("❌ WebSocket Error:", error);
        setConnectionStatus("error");
        setIsWebSocketConnected(false);
      },
      
      onDisconnect: (frame) => {
        console.log("🔌 WebSocket disconnected:", frame);
        setConnectionStatus("disconnected");
        setIsWebSocketConnected(false);
      }
    });

    try {
      client.activate();
      stompClientRef.current = client;
    } catch (error) {
      console.error("❌ Failed to activate WebSocket:", error);
      setConnectionStatus("error");
    }
  }, [groups, user]);

  // Connect WebSocket when groups are loaded or when activeGroup changes
  useEffect(() => {
    if (user && (groups.length > 0 || activeGroup)) {
      connectWebSocket();
    }
  }, [groups, user, activeGroup, connectWebSocket]);

  // Create group
  const handleCreateGroup = async () => {
    if (!groupName.trim() || !groupPassword.trim()) {
      toast.error("Please fill in all fields", {
        duration: 3000,
        position: "top-center",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${config.url}/api/groups/create`, {
        name: groupName,
        password: groupPassword,
        creatorUsername: user.username
      }, {
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` })
        }
      });

      toast.success(`✅ Group "${groupName}" created!`, {
        duration: 4000,
        position: "top-center",
      });

      setGroups(prev => [...prev, response.data]);
      setGroupName("");
      setGroupPassword("");
      setShowCreateGroup(false);
      
      // Auto-select the new group
      setActiveGroup(response.data);
      fetchGroupMessages(response.data.id);
      
    } catch (error) {
      console.error("❌ Error creating group:", error);
      const errorMessage = error.response?.data || error.message || "Unknown error occurred";
      toast.error(`Failed to create group: ${errorMessage}`, {
        duration: 6000,
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Join group
  const handleJoinGroup = async () => {
    if (!joinGroupId.trim() || !joinPassword.trim()) {
      toast.error("Please fill in all fields", {
        duration: 3000,
        position: "top-center",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${config.url}/api/groups/join/${joinGroupId}`, {
        username: user.username,
        password: joinPassword
      }, {
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` })
        }
      });

      toast.success(`✅ Joined group "${response.data.name}"!`, {
        duration: 4000,
        position: "top-center",
      });

      setGroups(prev => [...prev, response.data]);
      setJoinGroupId("");
      setJoinPassword("");
      setShowJoinGroup(false);
      
      // Auto-select the joined group
      setActiveGroup(response.data);
      fetchGroupMessages(response.data.id);
      
    } catch (error) {
      console.error("❌ Error joining group:", error);
      const errorMessage = error.response?.data || error.message || "Unknown error occurred";
      toast.error(`Failed to join group: ${errorMessage}`, {
        duration: 6000,
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Leave group
  const handleLeaveGroup = async (groupId) => {
    try {
      await axios.post(`${config.url}/api/groups/leave/${groupId}`, {
        username: user.username
      }, {
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` })
        }
      });

      toast.success("👋 Left group successfully", {
        duration: 3000,
        position: "top-center",
      });

      setGroups(prev => prev.filter(g => g.id !== groupId));
      
      if (activeGroup?.id === groupId) {
        setActiveGroup(null);
        setMessages([]);
      }
      
    } catch (error) {
      console.error("❌ Error leaving group:", error);
      const errorMessage = error.response?.data || error.message || "Unknown error occurred";
      toast.error(`Failed to leave group: ${errorMessage}`, {
        duration: 4000,
        position: "top-center",
      });
    }
  };

  // Fetch group messages
  const fetchGroupMessages = async (groupId) => {
    if (!groupId) return;
    
    try {
      const response = await axios.get(`${config.url}/api/groups/messages/${groupId}`, {
        headers: {
          ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` })
        }
      });
      
      // Filter messages based on file visibility
      const allMessages = response.data || [];
      const filteredMessages = allMessages.filter((message) => {
        if (message.type === 'file') {
          try {
            const fileData = JSON.parse(message.content);
            
            // If visibility is "all", show to everyone
            if (fileData.visibility === 'all') {
              return true;
            }
            
            // If visibility is "selected", only show to:
            // 1. The sender (always show your own files)
            // 2. Users in the visibleTo list
            if (fileData.visibility === 'selected') {
              if (message.senderUsername === user?.username) {
                return true; // Always show your own files
              }
              if (fileData.visibleTo && Array.isArray(fileData.visibleTo)) {
                return fileData.visibleTo.includes(user?.username);
              }
              return false; // If no visibleTo list, don't show
            }
            
            // Default: show if visibility is not set (backward compatibility)
            return true;
          } catch (e) {
            // If parsing fails, show the message (backward compatibility)
            return true;
          }
        }
        // Always show text messages
        return true;
      });
      
      setMessages(filteredMessages);
      console.log("✅ Messages fetched and filtered:", filteredMessages);
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
      toast.error("Failed to fetch messages", {
        duration: 4000,
        position: "top-center",
      });
      setMessages([]);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeGroup) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      await axios.post(`${config.url}/api/groups/message/${activeGroup.id}`, {
        senderUsername: user.username,
        content: messageContent,
        type: "text"
      }, {
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` })
        }
      });

      // Message will be received via WebSocket
      
    } catch (error) {
      console.error("❌ Error sending message:", error);
      toast.error("Failed to send message", {
        duration: 4000,
        position: "top-center",
      });
      // Restore message on error
      setNewMessage(messageContent);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast.error("File size must be less than 50MB", {
        duration: 4000,
        position: "top-center",
      });
      return;
    }

    setSelectedFile(file);
    setShowFileVisibilityModal(true);
    e.target.value = ''; // Reset input
  };

  // Upload file and send as message
  const handleFileUpload = async () => {
    if (!selectedFile || !activeGroup || !user?.id) return;

    setUploadingFile(true);
    try {
      // First upload the file
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadResponse = await axios.post(
        `${config.url}/api/file/upload/${user.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` })
          }
        }
      );

      // Get file ID from response
      const fileData = uploadResponse.data;
      if (!fileData || !fileData.id) {
        throw new Error("Could not retrieve uploaded file ID");
      }

      // Send message with file info
      await axios.post(`${config.url}/api/groups/message/${activeGroup.id}`, {
        senderUsername: user.username,
        content: JSON.stringify({
          fileId: fileData.id,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          visibility: fileVisibility,
          visibleTo: fileVisibility === "selected" ? selectedUsers : []
        }),
        type: "file"
      }, {
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` })
        }
      });

      toast.success(`✅ File "${selectedFile.name}" uploaded!`, {
        duration: 4000,
        position: "top-center",
      });

      setSelectedFile(null);
      setShowFileVisibilityModal(false);
      setFileVisibility("all");
      setSelectedUsers([]);
      
    } catch (error) {
      console.error("❌ Error uploading file:", error);
      toast.error(`Failed to upload file: ${error.response?.data || error.message}`, {
        duration: 6000,
        position: "top-center",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  // Download file
  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const response = await axios.get(`${config.url}/api/file/download/${fileId}`, {
        responseType: "blob",
        headers: {
          ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` })
        }
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`✅ Downloaded ${fileName}`, {
        duration: 3000,
        position: "top-center",
      });
    } catch (error) {
      console.error("❌ Error downloading file:", error);
      toast.error("Failed to download file", {
        duration: 4000,
        position: "top-center",
      });
    }
  };

  // Save file to drive
  const handleSaveToDrive = async (fileId, fileName) => {
    if (!user?.id) {
      toast.error("Please log in to save files", {
        duration: 4000,
        position: "top-center",
      });
      return;
    }

    setSavingToDrive(prev => ({ ...prev, [fileId]: true }));
    
    try {
      await axios.post(
        `${config.url}/api/file/copy-to-drive/${fileId}/${user.id}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` })
          }
        }
      );

      toast.success(`✅ "${fileName}" saved to Drive!`, {
        duration: 4000,
        position: "top-center",
      });
    } catch (error) {
      console.error("❌ Error saving file to drive:", error);
      const errorMessage = error.response?.data || error.message || "Unknown error occurred";
      
      if (errorMessage.includes("already exists")) {
        toast.error("File already exists in your Drive", {
          duration: 4000,
          position: "top-center",
        });
      } else {
        toast.error(`Failed to save file: ${errorMessage}`, {
          duration: 6000,
          position: "top-center",
        });
      }
    } finally {
      setSavingToDrive(prev => {
        const newState = { ...prev };
        delete newState[fileId];
        return newState;
      });
    }
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (fileType?.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (fileType?.startsWith('audio/')) return <Music className="h-5 w-5" />;
    if (fileType?.includes('pdf') || fileType?.includes('document') || fileType?.includes('text')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle key press in message input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Select group
  const selectGroup = (group) => {
    setActiveGroup(group);
    fetchGroupMessages(group.id);
    
    // Subscribe to this group's WebSocket if not already subscribed
    if (stompClientRef.current && stompClientRef.current.connected) {
      try {
        const subscription = stompClientRef.current.subscribe(`/topic/group/${group.id}`, (message) => {
          console.log("📨 Group message received:", message.body);
          try {
            const data = JSON.parse(message.body);
            console.log("📨 Parsed message data:", data);
            
            // Check file visibility before adding message
            if (data.type === 'file') {
              try {
                const fileData = JSON.parse(data.content);
                const currentUser = user?.username;
                
                // If visibility is "selected", check if current user is in visibleTo list
                if (fileData.visibility === 'selected') {
                  // Always show to sender
                  if (data.senderUsername === currentUser) {
                    // Allow it through
                  } else if (fileData.visibleTo && Array.isArray(fileData.visibleTo)) {
                    // Only show if current user is in visibleTo list
                    if (!fileData.visibleTo.includes(currentUser)) {
                      console.log("🚫 File not visible to current user, skipping");
                      return; // Don't add this message
                    }
                  } else {
                    // No visibleTo list means not visible to anyone except sender
                    if (data.senderUsername !== currentUser) {
                      console.log("🚫 File has no visibleTo list, skipping for non-sender");
                      return;
                    }
                  }
                }
                // If visibility is "all", show to everyone (no filtering needed)
              } catch (e) {
                // If parsing fails, allow the message (backward compatibility)
                console.log("⚠️ Could not parse file data, allowing message");
              }
            }
            
            // Only add if this is the active group
            const currentActiveGroup = activeGroupRef.current;
            if (currentActiveGroup?.id === group.id || data.groupId === group.id) {
              setMessages(prev => {
                const exists = prev.some(m => m.id === data.id);
                if (!exists) {
                  console.log("✅ Adding message to state:", data);
                  return [...prev, data];
                }
                return prev;
              });
              
              if (data.senderUsername !== user?.username) {
                // For file messages, show a different notification
                if (data.type === 'file') {
                  try {
                    const fileData = JSON.parse(data.content);
                    toast(`📎 ${data.senderUsername} shared a file: ${fileData.fileName}`, {
                      duration: 4000,
                      position: "top-right",
                    });
                  } catch (e) {
                    toast(`📎 ${data.senderUsername} shared a file`, {
                      duration: 4000,
                      position: "top-right",
                    });
                  }
                } else {
                  toast(`💬 ${data.senderUsername}: ${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}`, {
                    duration: 4000,
                    position: "top-right",
                  });
                }
              }
            }
          } catch (parseError) {
            console.error("Parse error:", parseError);
          }
        });
        console.log(`✅ Subscribed to group ${group.id}`);
      } catch (error) {
        console.error("Failed to subscribe to group:", error);
      }
    }
  };

  // Filter groups based on search
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading && groups.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your chats...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex flex-col">
      <SharedNavBar />
      
      {/* Main Chat Container */}
      <div className="flex-1 flex">
        {/* Sidebar - Groups List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-black to-gray-800 rounded-xl flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Chats</h1>
                <div className={`flex items-center space-x-1 text-xs ${getStatusColor(connectionStatus)}`}>
                  {connectionStatus === "connected" ? (
                    <Wifi className="h-3 w-3" />
                  ) : (
                    <WifiOff className="h-3 w-3" />
                  )}
                  <span className="capitalize">{connectionStatus}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowJoinGroup(true)}
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Join Group"
              >
                <UserPlus className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateGroup(true)}
                className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Create Group"
              >
                <Plus className="h-4 w-4" />
              </motion.button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-all duration-200"
            />
          </div>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto">
          {filteredGroups.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No groups yet</h3>
              <p className="text-xs text-gray-500 mb-4">Create or join a group to start chatting</p>
              <div className="space-y-2">
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="w-full px-3 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors duration-200"
                >
                  Create Group
                </button>
                <button
                  onClick={() => setShowJoinGroup(true)}
                  className="w-full px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors duration-200"
                >
                  Join Group
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2">
              {filteredGroups.map((group) => (
                <motion.div
                  key={group.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectGroup(group)}
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-200 mb-2 group ${
                    activeGroup?.id === group.id
                      ? "bg-black text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        activeGroup?.id === group.id
                          ? "bg-white/20"
                          : "bg-gray-100"
                      }`}>
                        <Hash className={`h-5 w-5 ${
                          activeGroup?.id === group.id ? "text-white" : "text-gray-600"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium truncate ${
                          activeGroup?.id === group.id ? "text-white" : "text-gray-900"
                        }`}>
                          {group.name}
                        </h3>
                        <p className={`text-xs truncate ${
                          activeGroup?.id === group.id ? "text-white/70" : "text-gray-500"
                        }`}>
                          {group.usernames?.length || 0} members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLeaveGroup(group.id);
                        }}
                        className={`p-1 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                          activeGroup?.id === group.id
                            ? "hover:bg-white/20 text-white"
                            : "hover:bg-gray-200 text-gray-500"
                        }`}
                        title="Leave Group"
                      >
                        <LogOut className="h-3 w-3" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeGroup ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-black to-gray-800 rounded-xl flex items-center justify-center">
                    <Hash className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{activeGroup.name}</h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-gray-500">
                        {activeGroup.usernames?.length || 0} members
                      </p>
                      <span className="text-gray-300">•</span>
                      <p className="text-xs text-gray-400 font-mono">
                        ID: {activeGroup.id}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      navigator.clipboard.writeText(activeGroup.id);
                      toast.success("Group ID copied!", { duration: 2000 });
                    }}
                    className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200"
                    title="Copy Group ID"
                  >
                    <Copy className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowGroupSettings(true)}
                    className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200"
                    title="Group Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                    <p className="text-gray-500">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages
                  .filter((message) => {
                    // Filter messages based on file visibility
                    if (message.type === 'file') {
                      try {
                        const fileData = JSON.parse(message.content);
                        
                        // If visibility is "all", show to everyone
                        if (fileData.visibility === 'all') {
                          return true;
                        }
                        
                        // If visibility is "selected", only show to:
                        // 1. The sender (always show your own files)
                        // 2. Users in the visibleTo list
                        if (fileData.visibility === 'selected') {
                          if (message.senderUsername === user?.username) {
                            return true; // Always show your own files
                          }
                          if (fileData.visibleTo && Array.isArray(fileData.visibleTo)) {
                            return fileData.visibleTo.includes(user?.username);
                          }
                          return false; // If no visibleTo list, don't show
                        }
                        
                        // Default: show if visibility is not set (backward compatibility)
                        return true;
                      } catch (e) {
                        // If parsing fails, show the message (backward compatibility)
                        return true;
                      }
                    }
                    // Always show text messages
                    return true;
                  })
                  .map((message, index) => {
                  // Check if message is a file
                  let fileData = null;
                  if (message.type === 'file') {
                    try {
                      fileData = JSON.parse(message.content);
                    } catch (e) {
                      // If parsing fails, might be old format with just fileId
                      fileData = { fileId: message.content, fileName: 'File' };
                    }
                  }

                  return (
                    <motion.div
                      key={message.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.senderUsername === user?.username ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        message.senderUsername === user?.username
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        {message.senderUsername !== user?.username && (
                          <p className="text-xs font-medium mb-1 opacity-70">
                            {message.senderUsername}
                          </p>
                        )}
                        
                        {message.type === 'file' && fileData ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3 p-2 bg-white/10 rounded-lg">
                              <div className={`${message.senderUsername === user?.username ? 'text-white' : 'text-gray-600'}`}>
                                {getFileIcon(fileData.fileType)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  message.senderUsername === user?.username ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {fileData.fileName || 'File'}
                                </p>
                                {fileData.fileSize && (
                                  <p className={`text-xs ${
                                    message.senderUsername === user?.username ? 'text-white/70' : 'text-gray-500'
                                  }`}>
                                    {formatFileSize(fileData.fileSize)}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center space-x-1">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleSaveToDrive(fileData.fileId, fileData.fileName)}
                                  disabled={savingToDrive[fileData.fileId]}
                                  className={`p-2 rounded-lg transition-all duration-200 ${
                                    savingToDrive[fileData.fileId]
                                      ? 'opacity-50 cursor-not-allowed'
                                      : message.senderUsername === user?.username
                                        ? 'bg-white/20 hover:bg-white/30 text-white'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                  }`}
                                  title="Save to Drive"
                                >
                                  {savingToDrive[fileData.fileId] ? (
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <FolderPlus className="h-4 w-4" />
                                  )}
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDownloadFile(fileData.fileId, fileData.fileName)}
                                  className={`p-2 rounded-lg transition-all duration-200 ${
                                    message.senderUsername === user?.username
                                      ? 'bg-white/20 hover:bg-white/30 text-white'
                                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                  }`}
                                  title="Download file"
                                >
                                  <Download className="h-4 w-4" />
                                </motion.button>
                              </div>
                            </div>
                            {fileData.visibility === 'selected' && fileData.visibleTo?.length > 0 && (
                              <p className={`text-xs ${
                                message.senderUsername === user?.username ? 'text-white/60' : 'text-gray-400'
                              }`}>
                                Visible to: {fileData.visibleTo.join(', ')}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                        
                        <p className={`text-xs mt-1 ${
                          message.senderUsername === user?.username ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isWebSocketConnected || uploadingFile}
                  className={`p-3 rounded-full transition-all duration-200 ${
                    isWebSocketConnected && !uploadingFile
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title="Attach file"
                >
                  {uploadingFile ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                </motion.button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Message ${activeGroup.name}...`}
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:border-black transition-all duration-200"
                    disabled={!isWebSocketConnected}
                  />
                  {!isWebSocketConnected && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <WifiOff className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !isWebSocketConnected}
                  className={`p-3 rounded-full transition-all duration-200 ${
                    newMessage.trim() && isWebSocketConnected
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-20 w-20 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Chat</h2>
              <p className="text-gray-500 mb-6">Select a group to start messaging</p>
              <div className="space-x-3">
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
                >
                  Create Group
                </button>
                <button
                  onClick={() => setShowJoinGroup(true)}
                  className="px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Join Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateGroup(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Create Group</h3>
              <button
                onClick={() => setShowCreateGroup(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-all duration-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={groupPassword}
                    onChange={(e) => setGroupPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateGroup(false)}
                className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={isLoading || !groupName.trim() || !groupPassword.trim()}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                  isLoading || !groupName.trim() || !groupPassword.trim()
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {isLoading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Join Group Modal */}
      {showJoinGroup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowJoinGroup(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Join Group</h3>
              <button
                onClick={() => setShowJoinGroup(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group ID
                </label>
                <input
                  type="text"
                  value={joinGroupId}
                  onChange={(e) => setJoinGroupId(e.target.value)}
                  placeholder="Enter group ID"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-all duration-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showJoinPassword ? "text" : "password"}
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowJoinPassword(!showJoinPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showJoinPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowJoinGroup(false)}
                className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinGroup}
                disabled={isLoading || !joinGroupId.trim() || !joinPassword.trim()}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                  isLoading || !joinGroupId.trim() || !joinPassword.trim()
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {isLoading ? 'Joining...' : 'Join Group'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* File Visibility Modal */}
      {showFileVisibilityModal && selectedFile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            if (!uploadingFile) {
              setShowFileVisibilityModal(false);
              setSelectedFile(null);
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Upload File</h3>
              <button
                onClick={() => {
                  if (!uploadingFile) {
                    setShowFileVisibilityModal(false);
                    setSelectedFile(null);
                  }
                }}
                disabled={uploadingFile}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* File Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-gray-600">
                  {getFileIcon(selectedFile.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
            </div>

            {/* Visibility Options */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  File Visibility
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="visibility"
                      value="all"
                      checked={fileVisibility === "all"}
                      onChange={(e) => setFileVisibility(e.target.value)}
                      className="text-black focus:ring-black"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">All Group Members</p>
                      <p className="text-xs text-gray-500">Everyone in the group can see and download</p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="visibility"
                      value="selected"
                      checked={fileVisibility === "selected"}
                      onChange={(e) => setFileVisibility(e.target.value)}
                      className="text-black focus:ring-black"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Selected Members</p>
                      <p className="text-xs text-gray-500">Only selected members can see and download</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* User Selection (if selected visibility) */}
              {fileVisibility === "selected" && activeGroup?.usernames && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Members
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                    {activeGroup.usernames
                      .filter(username => username !== user?.username)
                      .map((username) => (
                        <label
                          key={username}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(username)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, username]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(u => u !== username));
                              }
                            }}
                            className="text-black focus:ring-black rounded"
                          />
                          <span className="text-sm text-gray-700">{username}</span>
                        </label>
                      ))}
                    {activeGroup.usernames.filter(username => username !== user?.username).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-2">No other members in group</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  if (!uploadingFile) {
                    setShowFileVisibilityModal(false);
                    setSelectedFile(null);
                    setFileVisibility("all");
                    setSelectedUsers([]);
                  }
                }}
                disabled={uploadingFile}
                className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={uploadingFile || (fileVisibility === "selected" && selectedUsers.length === 0)}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                  uploadingFile || (fileVisibility === "selected" && selectedUsers.length === 0)
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {uploadingFile ? (
                  <span className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Uploading...
                  </span>
                ) : (
                  'Upload & Send'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
