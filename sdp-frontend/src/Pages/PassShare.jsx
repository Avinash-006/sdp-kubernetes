import { motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { FileUp, Copy, Key, Upload, Download, X, WifiOff, Wifi } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { Client } from "@stomp/stompjs";
import { useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import SharedNavBar from "../components/SharedNavBar";
import config from "../../config";

export default function PassShare() {
  const [passkey, setPasskey] = useState("");
  const [joinPasskey, setJoinPasskey] = useState("");
  const [isInSession, setIsInSession] = useState(false);
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [downloadProgress, setDownloadProgress] = useState({});
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  
  const fileInputRef = useRef(null);
  const stompClientRef = useRef(null);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

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

  // Get WebSocket URL from config
  const getWebSocketUrl = useCallback(() => {
    return config.wsUrl;
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        localStorage.removeItem("user");
        navigate("/signin");
      }
    } else {
      toast.error("Please log in to create or join a session", {
        duration: 4000,
        position: "top-center",
      });
      navigate("/signin");
      return;
    }

    // Cleanup function
    return () => {
      if (stompClientRef.current) {
        console.log("🧹 Cleaning up WebSocket connection");
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [navigate]);

  // Enhanced WebSocket connection with proper protocol handling
  const connectWebSocket = useCallback((passkey) => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
    }

    setConnectionStatus("connecting");
    setIsWebSocketConnected(false);
    setReconnectAttempts(0);
    
    // Use WebSocket URL directly from config
    console.log(`🔌 Connecting WebSocket to ${config.wsUrl} for passkey: ${passkey}`);

    const client = new Client({
      // Don't use brokerURL with SockJS
      
      // Connection headers for authentication
      connectHeaders: {
        Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : undefined
      },
      
      // Reconnection settings
      reconnectDelay: 2000,
      maxReconnectAttempts: maxReconnectAttempts,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      // Use SockJS for WebSocket connection
      webSocketFactory: () => {
        return new SockJS(config.wsUrl);
      },
      
      // Debug logging (reduced for production)
      debug: (str) => {
        if (process.env.NODE_ENV === 'development') {
          // Only log important events
          if (str.includes('connected') || str.includes('disconnected') || 
              str.includes('error') || str.includes('reconnect')) {
            console.log("🔌 STOMP:", str);
          }
        }
      },
      
      // Connection callbacks
      onConnect: (frame) => {
        console.log(`✅ Successfully connected to WebSocket for passkey: ${passkey}`);
        console.log("Connection frame:", frame);
        
        setConnectionStatus("connected");
        setIsWebSocketConnected(true);
        setReconnectAttempts(0);
        
        try {
          // Subscribe to session-specific topic
          const subscription = client.subscribe(`/topic/session/${passkey}`, (message) => {
            console.log("📨 WebSocket message received:", message.body);
            try {
              const data = JSON.parse(message.body);
              console.log("📄 Parsed message:", data);
              
              switch (data.type) {
                case 'file_uploaded':
                  toast.success(`${data.username || 'Someone'} uploaded ${data.filename}`, {
                    duration: 4000,
                    position: "top-center",
                    icon: "📁"
                  });
                  fetchSessionFiles(passkey);
                  break;
                case 'user_joined':
                  toast(`👋 ${data.username} joined the session`, {
                    duration: 3000,
                    position: "top-center",
                  });
                  break;
                case 'user_left':
                  toast(`👋 ${data.username} left the session`, {
                    duration: 3000,
                    position: "top-center",
                  });
                  break;
                case 'session_created':
                  toast.success("🎉 Session created successfully!", {
                    duration: 3000,
                    position: "top-center",
                  });
                  break;
                default:
                  console.log("📝 Unknown message type:", data.type);
                  // Refresh files for unknown message types
                  fetchSessionFiles(passkey);
              }
            } catch (parseError) {
              console.log("⚠️ Could not parse message:", message.body);
              console.error("Parse error:", parseError);
              // Still refresh files even if parsing fails
              fetchSessionFiles(passkey);
            }
          });
          
          // Store subscription for cleanup
          stompClientRef.current.subscription = subscription;
          
          toast.success("✅ Connected to session in real-time!", {
            duration: 3000,
            position: "top-center",
            id: "websocket-success"
          });
          
        } catch (subscribeError) {
          console.error("Failed to subscribe to topic:", subscribeError);
          setConnectionStatus("error");
        }
      },
      
      onStompError: (frame) => {
        console.error("❌ STOMP Error:", frame);
        setConnectionStatus("error");
        setIsWebSocketConnected(false);
        setReconnectAttempts(prev => prev + 1);
        
        if (reconnectAttempts >= maxReconnectAttempts - 1) {
          toast.error("❌ WebSocket connection failed after multiple attempts. Files will still work but real-time updates are disabled.", {
            duration: 7000,
            position: "top-center",
            id: "websocket-error"
          });
        } else {
          toast(`🔄 Reconnecting... (${reconnectAttempts + 1}/${maxReconnectAttempts})`, {
            duration: 3000,
            position: "top-center",
            id: "websocket-reconnect"
          });
        }
      },
      
      onWebSocketError: (error) => {
        console.error("❌ WebSocket Error:", error);
        setConnectionStatus("error");
        setIsWebSocketConnected(false);
        setReconnectAttempts(prev => prev + 1);
        
        const errorMessage = error?.message || "Unknown WebSocket error";
        console.error("WebSocket error details:", errorMessage);
        
        if (reconnectAttempts >= maxReconnectAttempts - 1) {
          toast.error(`❌ Cannot connect to WebSocket: ${errorMessage}. Please check if the server is running on ${config.wsUrl}. Files will still work normally.`, {
            duration: 8000,
            position: "top-center",
            id: "websocket-error"
          });
        } else {
          toast(`🔄 Connection failed: ${errorMessage}. Retrying...`, {
            duration: 4000,
            position: "top-center",
            id: "websocket-reconnect"
          });
        }
      },
      
      onDisconnect: (frame) => {
        console.log("🔌 WebSocket disconnected:", frame);
        setConnectionStatus("disconnected");
        setIsWebSocketConnected(false);
        
        if (isInSession) {
          toast("🔌 Connection lost. Attempting to reconnect...", {
            duration: 3000,
            position: "top-center",
            id: "websocket-disconnect"
          });
        }
      },
      
      // Fallback for connection issues
      onWebSocketClose: (event) => {
        console.log("🔌 WebSocket closed:", event.code, event.reason);
        if (event.code !== 1000) { // 1000 is normal closure
          setConnectionStatus("error");
          toast.error(`WebSocket closed unexpectedly (Code: ${event.code}). Retrying...`, {
            duration: 4000,
            position: "top-center",
            id: "websocket-close-error"
          });
        }
      }
    });

    try {
      console.log("🚀 Activating WebSocket client...");
      client.activate();
      stompClientRef.current = client;
    } catch (activationError) {
      console.error("❌ Failed to activate WebSocket client:", activationError);
      setConnectionStatus("error");
      toast.error("Failed to initialize WebSocket connection. Please check server status.", {
        duration: 6000,
        position: "top-center",
        id: "websocket-init-error"
      });
    }
  }, [isInSession, reconnectAttempts]);

  const disconnectWebSocket = useCallback(() => {
    if (stompClientRef.current) {
      console.log("🔌 Manually disconnecting WebSocket");
      try {
        stompClientRef.current.deactivate();
      } catch (error) {
        console.error("Error during manual disconnect:", error);
      }
      stompClientRef.current = null;
      setIsWebSocketConnected(false);
      setConnectionStatus("disconnected");
      setReconnectAttempts(0);
    }
  }, []);

  const generatePasskey = async () => {
    if (!user?.username) {
      toast.error("No username available. Please log in.", {
        duration: 4000,
        position: "top-center",
      });
      return;
    }

    setIsLoading(true);
    setConnectionStatus("connecting");
    
    console.log("🔑 Generating passkey...");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPasskey(result);
    console.log("📤 Sending passkey to backend:", { passkey: result, username: user.username });

    try {
      const response = await axios.post(
        `${config.url}/api/sessions/create`,
        {
          passkey: result,
          username: user.username,
        },
        {
          headers: { 
            "Content-Type": "application/json",
            ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` })
          },
        }
      );
      console.log("✅ Backend response:", response.data);
      setIsInSession(true);
      toast.success(`🎉 Session created with passkey: ${result}`, {
        duration: 5000,
        position: "top-center",
      });
      
      // Connect WebSocket after a short delay to ensure session is created
      setTimeout(() => {
        connectWebSocket(result);
        fetchSessionFiles(result);
      }, 1000);
      
    } catch (error) {
      console.error("❌ Error in generatePasskey:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.response?.data || error.message || "Unknown error occurred";
      toast.error(`Failed to create session: ${errorMessage}`, {
        duration: 6000,
        position: "top-center",
      });
      setPasskey("");
      setConnectionStatus("disconnected");
      setIsInSession(false);
    } finally {
      setIsLoading(false);
    }
  };

  const copyPasskey = () => {
    if (passkey) {
      navigator.clipboard.writeText(passkey).then(() => {
        toast.success("📋 Passkey copied to clipboard!", {
          duration: 3000,
          position: "top-center",
        });
      }).catch((err) => {
        console.error("Failed to copy passkey:", err);
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = passkey;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          toast.success("📋 Passkey copied to clipboard!", {
            duration: 3000,
            position: "top-center",
          });
        } catch (fallbackErr) {
          console.error("Fallback copy failed:", fallbackErr);
          toast.error("Failed to copy passkey", {
            duration: 3000,
            position: "top-center",
          });
        } finally {
          document.body.removeChild(textArea);
        }
      });
    }
  };

  const handleJoin = async () => {
    if (!user?.username) {
      toast.error("Please log in to join a session", {
        duration: 4000,
        position: "top-center",
      });
      return;
    }

    if (!joinPasskey.trim()) {
      toast.error("Please enter a passkey", {
        duration: 3000,
        position: "top-center",
      });
      return;
    }

    setIsLoading(true);
    setConnectionStatus("connecting");
    
    console.log(`🔑 Attempting to join session with passkey: ${joinPasskey}`);
    try {
      const response = await axios.post(
        `${config.url}/api/sessions/join`,
        {
          passkey: joinPasskey,
          username: user.username,
        },
        {
          headers: { 
            "Content-Type": "application/json",
            ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` })
          },
        }
      );
      console.log("✅ Join response:", response.data);
      setPasskey(joinPasskey);
      setIsInSession(true);
      toast.success("🎉 Joined session successfully!", {
        duration: 4000,
        position: "top-center",
      });
      
      // Connect WebSocket after a short delay
      setTimeout(() => {
        connectWebSocket(joinPasskey);
        fetchSessionFiles(joinPasskey);
      }, 1000);
      
    } catch (error) {
      console.error("❌ Error in handleJoin:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.response?.data || error.message || "Unknown error occurred";
      toast.error(`Failed to join session: ${errorMessage}`, {
        duration: 6000,
        position: "top-center",
      });
      setConnectionStatus("disconnected");
    } finally {
      setIsLoading(false);
      // Don't clear joinPasskey here to allow retry
    }
  };

  const leaveSession = () => {
    disconnectWebSocket();
    setIsInSession(false);
    setPasskey("");
    setJoinPasskey("");
    setFiles([]);
    setUploadProgress({});
    setDownloadProgress({});
    setShowLeaveModal(false);
    setConnectionStatus("disconnected");
    toast.success("👋 Left session successfully", {
      duration: 3000,
      position: "top-center",
    });
  };

  const fetchSessionFiles = async (sessionPasskey) => {
    if (!sessionPasskey) {
      console.warn("No passkey provided for fetchSessionFiles");
      return;
    }
    
    console.log(`📂 Fetching files for passkey: ${sessionPasskey}`);
    try {
      const response = await axios.get(`${config.url}/api/sessions/files/${sessionPasskey}`, {
        headers: {
          ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` })
        },
        timeout: 10000 // 10 second timeout
      });
      console.log("✅ Files response:", response.data);
      setFiles(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("❌ Error in fetchSessionFiles:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.response?.data || error.message || "Unknown error occurred";
      
      if (error.code === 'ECONNABORTED') {
        toast.error("Request timeout. Please try again.", {
          duration: 5000,
          position: "top-center",
        });
      } else {
        toast.error(`Failed to fetch files: ${errorMessage}`, {
          duration: 6000,
          position: "top-center",
        });
      }
      setFiles([]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!user?.id) {
      toast.error("Please log in to upload files", {
        duration: 4000,
        position: "top-center",
      });
      return;
    }

    if (!passkey) {
      toast.error("No active session found", {
        duration: 4000,
        position: "top-center",
      });
      return;
    }

    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/pdf",
      "video/mp4",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (!validTypes.includes(file.type)) {
      toast.error(
        "Unsupported file type. Please upload PNG, JPEG, PDF, MP4, or DOCX files.",
        {
          duration: 4000,
          position: "top-center",
        }
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB.", {
        duration: 4000,
        position: "top-center",
      });
      return;
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setUploadProgress((prev) => ({ ...prev, [tempId]: 0 }));

    const formData = new FormData();
    formData.append("file", file);
    
    const uploadToastId = toast.loading(`Uploading ${file.name}...`, {
      duration: 10000,
      position: "top-center",
    });
    
    try {
      console.log(`📤 Uploading file to ${config.url}/api/sessions/upload/${passkey}/${user.id}`);
      await axios.post(
        `${config.url}/api/sessions/upload/${passkey}/${user.id}`,
        formData,
        {
          headers: { 
            "Content-Type": "multipart/form-data",
            ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` })
          },
          timeout: 30000, // 30 second timeout for file uploads
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress((prev) => ({
                ...prev,
                [tempId]: percentCompleted,
              }));
              
              // Update toast with progress
              toast.loading(`Uploading ${file.name}... ${percentCompleted}%`, {
                id: uploadToastId,
                duration: 10000,
                position: "top-center",
              });
            }
          },
        }
      );
      
      toast.success(`✅ Uploaded ${file.name}`, {
        id: uploadToastId,
        duration: 4000,
        position: "top-center",
        icon: "📁"
      });
      fetchSessionFiles(passkey);
    } catch (error) {
      console.error("❌ Error in handleFileUpload:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.response?.data || error.message || "Unknown error occurred";
      
      toast.error(
        `Failed to upload ${file.name}: ${errorMessage}`,
        {
          id: uploadToastId,
          duration: 6000,
          position: "top-center",
        }
      );
    } finally {
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[tempId];
        return newProgress;
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
      file.type && validFileTypes.includes(file.type)
    );
    if (droppedFiles.length === 0) {
      toast.error("No valid files to upload", {
        duration: 3000,
        position: "top-center",
      });
      return;
    }
    toast(`📁 Uploading ${droppedFiles.length} file(s)...`, {
      duration: 3000,
      position: "top-center",
    });
    droppedFiles.forEach(handleFileUpload);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(file => 
        file.type && validFileTypes.includes(file.type)
      );
      if (selectedFiles.length === 0) {
        toast.error("No valid files selected", {
          duration: 3000,
          position: "top-center",
        });
        return;
      }
      toast(`📁 Uploading ${selectedFiles.length} file(s)...`, {
        duration: 3000,
        position: "top-center",
      });
      selectedFiles.forEach(handleFileUpload);
      e.target.value = ''; // Reset input
    }
  };

  const validFileTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "application/pdf",
    "video/mp4",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const handleDownload = async (fileId, fileName) => {
    if (!fileId || !fileName) {
      toast.error("Invalid file data", {
        duration: 3000,
        position: "top-center",
      });
      return;
    }

    setDownloadProgress((prev) => ({ ...prev, [fileId]: 0 }));
    const downloadToastId = toast.loading(`Downloading ${fileName}...`, {
      duration: 10000,
      position: "top-center",
    });
    
    try {
      console.log(`⬇️ Downloading file ${fileId} from ${config.url}/api/file/download/${fileId}`);
      const response = await axios.get(`${config.url}/api/file/download/${fileId}`, {
        responseType: "blob",
        headers: {
          ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` })
        },
        timeout: 30000, // 30 second timeout for downloads
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setDownloadProgress((prev) => ({
              ...prev,
              [fileId]: percentCompleted,
            }));
            
            // Update toast with progress
            toast.loading(`Downloading ${fileName}... ${percentCompleted}%`, {
              id: downloadToastId,
              duration: 10000,
              position: "top-center",
            });
          }
        },
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
        id: downloadToastId,
        duration: 4000,
        position: "top-center",
        icon: "⬇️"
      });
    } catch (error) {
      console.error("❌ Error in handleDownload:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.response?.data || error.message || "Unknown error occurred";
      toast.error(
        `Failed to download ${fileName}: ${errorMessage}`,
        {
          id: downloadToastId,
          duration: 6000,
          position: "top-center",
        }
      );
    } finally {
      setDownloadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 text-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full px-6 py-8 bg-white rounded-3xl shadow-xl border border-gray-200"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-black to-gray-800 rounded-full mb-6 mx-auto shadow-lg"
            >
              <Key className="h-10 w-10 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Connecting...</h1>
            <p className="text-gray-600">Setting up secure session</p>
          </div>
          <div className="flex justify-center">
            <div className="w-10 h-10 border-3 border-gray-300 border-t-black rounded-full animate-spin" />
          </div>
        </motion.div>
      </div>
    );
  }

  // Session creation/joining UI
  if (!isInSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 text-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full px-6 py-8 bg-white rounded-3xl shadow-xl border border-gray-200"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-black to-gray-800 rounded-full mb-6 mx-auto shadow-lg"
            >
              <Key className="h-10 w-10 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Secure File Sharing</h1>
            <p className="text-gray-600">Create or join a secure session</p>
          </div>

          <div className="space-y-6">
            {/* Generate Passkey Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-black rounded-full" />
                <span className="text-sm font-medium text-gray-600">Session Code</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={passkey}
                  readOnly
                  placeholder="Click generate to create a session"
                  className={`w-full pl-12 pr-4 py-4 border-2 rounded-full focus:outline-none focus:border-black transition-all duration-300 text-base font-medium ${
                    isLoading
                      ? "bg-gray-100 cursor-not-allowed"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-md bg-white"
                  }`}
                  disabled={isLoading}
                />
                {passkey && !isLoading && (
                  <motion.button
                    type="button"
                    onClick={copyPasskey}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black transition-colors duration-200"
                  >
                    <Copy className="h-5 w-5" />
                  </motion.button>
                )}
              </div>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={generatePasskey}
              disabled={isLoading || !user}
              className={`w-full py-4 px-6 rounded-full font-semibold text-base transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg ${
                isLoading || !user
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-75"
                  : "bg-gradient-to-r from-black to-gray-800 text-white hover:from-gray-800 hover:to-black hover:shadow-xl"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating Session...</span>
                </>
              ) : (
                <>
                  <Key className="h-5 w-5" />
                  <span>Create Session</span>
                </>
              )}
            </motion.button>

            <div className="flex items-center space-x-4">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="text-gray-400 text-sm px-4">or</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>

            {/* Join Session Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-black rounded-full" />
                <span className="text-sm font-medium text-gray-600">Join with Code</span>
              </div>
              <input
                type="text"
                value={joinPasskey}
                onChange={(e) => setJoinPasskey(e.target.value.toUpperCase())}
                placeholder="Enter 8-character passkey"
                className={`w-full pl-12 pr-4 py-4 border-2 rounded-full focus:outline-none focus:border-black transition-all duration-300 text-base font-medium ${
                  isLoading
                    ? "bg-gray-100 cursor-not-allowed"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md bg-white"
                }`}
                disabled={isLoading}
                maxLength={8}
              />
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleJoin}
              disabled={isLoading || !joinPasskey.trim() || !user}
              className={`w-full py-4 px-6 rounded-full font-semibold text-base transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg ${
                isLoading || !joinPasskey.trim() || !user
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-75"
                  : "bg-gradient-to-r from-black to-gray-800 text-white hover:from-gray-800 hover:to-black hover:shadow-xl"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Joining Session...</span>
                </>
              ) : (
                <>
                  <Key className="h-5 w-5" />
                  <span>Join Session</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main session interface
  return (
    <>
      <SharedNavBar />
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 text-black p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with connection status */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-black to-gray-800 rounded-xl flex items-center justify-center">
                  <Key className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Secure File Sharing</h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="bg-black text-white px-3 py-1 rounded-full text-sm font-medium">
                      {passkey}
                    </div>
                    <motion.button
                      onClick={copyPasskey}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200"
                      title="Copy passkey"
                    >
                      <Copy className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center space-x-2 text-sm">
                <div className={`flex items-center space-x-1 ${getStatusColor(connectionStatus)} px-2`}>
                  {connectionStatus === "connected" ? (
                    <Wifi className="h-4 w-4" />
                  ) : (
                    <WifiOff className="h-4 w-4" />
                  )}
                  <span className="capitalize">{connectionStatus}</span>
                </div>
                
                <motion.button
                  onClick={() => setShowLeaveModal(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200 flex items-center space-x-2"
                  title="Leave session"
                >
                  <X className="h-4 w-4" />
                  <span className="text-sm hidden sm:inline">Leave</span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Upload Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8"
          >
            <div className="text-center mb-6">
              <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Files</h2>
              <p className="text-gray-600">Drag & drop or click to browse</p>
              <p className="text-sm text-gray-500 mt-1">Supports: PNG, JPEG, PDF, MP4, DOC, DOCX (Max 10MB)</p>
              {!isWebSocketConnected && (
                <p className="text-sm text-yellow-600 mt-2 flex items-center justify-center space-x-1">
                  <WifiOff className="h-4 w-4" />
                  <span>Real-time updates disabled - connection issue</span>
                </p>
              )}
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer relative overflow-hidden ${
                isDragging
                  ? "border-black bg-black/5 shadow-lg"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {isDragging && (
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-10">
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-black mx-auto mb-2" />
                    <p className="text-black font-medium">Drop files here</p>
                  </div>
                </div>
              )}
              
              {!isDragging && (
                <>
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                    accept=".png,.jpg,.jpeg,.pdf,.mp4,.doc,.docx"
                  />
                  <p className="text-gray-700 font-medium mb-2">Click to browse or drag files here</p>
                  <p className="text-sm text-gray-500">Supports multiple file selection</p>
                </>
              )}
            </div>

            {/* Upload Progress */}
            {Object.keys(uploadProgress).length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Upload Progress</h4>
                {Object.entries(uploadProgress).map(([id, progress]) => (
                  <div key={id} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-black to-gray-800 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{progress}%</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Files List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {files.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                <FileUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No files yet</h3>
                <p className="text-gray-600">Upload the first file to get started</p>
                {isWebSocketConnected && (
                  <p className="text-sm text-green-600 mt-2 flex items-center justify-center space-x-1">
                    <Wifi className="h-4 w-4" />
                    <span>Real-time updates enabled</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Shared Files ({files.length})</h3>
                {files.map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:border-black hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                          <FileUp className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-gray-900 font-medium truncate max-w-xs" title={file.fileName || file.name}>
                            {file.fileName || file.name || 'Unknown file'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatFileSize(file.size || 0)} • Uploaded by {file.uploadedBy || 'Anonymous'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 ml-4">
                        {downloadProgress[file.id] > 0 && (
                          <div className="flex items-center space-x-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-black to-gray-800 rounded-full transition-all duration-300"
                                style={{ width: `${downloadProgress[file.id]}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{downloadProgress[file.id]}%</span>
                          </div>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDownload(file.id, file.fileName || file.name)}
                          className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200 group-hover:bg-gray-50"
                          title={`Download ${file.fileName || file.name}`}
                        >
                          <Download className="h-5 w-5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Leave Session Modal */}
      {showLeaveModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLeaveModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Leave Session</h3>
              <p className="text-gray-600">Are you sure you want to leave this session? You'll need the passkey to rejoin.</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={leaveSession}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium"
              >
                Leave Session
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Global Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>

      <style jsx global>{`
        .react-hot-toast {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .react-hot-toast .Toastify__toast {
          padding: 12px 20px;
          border-radius: 16px;
          font-weight: 500;
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid;
        }
        .react-hot-toast .Toastify__toast--success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-color: #059669;
        }
        .react-hot-toast .Toastify__toast--error {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border-color: #dc2626;
        }
        .react-hot-toast .Toastify__toast--default {
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
          color: white;
          border-color: #4b5563;
        }
        .react-hot-toast .Toastify__toast--loading {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border-color: #1d4ed8;
        }
      `}</style>
    </>
  );
}