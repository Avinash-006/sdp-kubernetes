import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { FileUp, Copy, Key, Upload, Download } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { useNavigate } from "react-router-dom";
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
  const fileInputRef = useRef(null);
  const stompClientRef = useRef(null);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      toast.error("Please log in to create or join a session", {
        duration: 4000,
        position: "top-center",
      });
      navigate("/signin");
    }
    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [navigate]);

  const generatePasskey = async () => {
    if (!user?.username) {
      toast.error("No username available. Please log in.", {
        duration: 4000,
        position: "top-center",
      });
      return;
    }

    setIsLoading(true);
    console.log("Generating passkey...");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPasskey(result);
    console.log("Sending passkey to backend:", { passkey: result, username: user.username });

    try {
      const response = await axios.post(
        `${config.url}/api/sessions/create`,
        {
          passkey: result,
          username: user.username,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log("Backend response:", response.data);
      setIsInSession(true);
      toast.success(`Session created with passkey: ${result}`, {
        duration: 4000,
        position: "top-center",
      });
      connectWebSocket(result);
      fetchSessionFiles(result);
    } catch (error) {
      console.error("Error in generatePasskey:", error.response ? error.response.data : error.message);
      toast.error(
        `Failed to create session: ${error.response?.data || error.message}`,
        {
          duration: 6000,
          position: "top-center",
        }
      );
      setPasskey("");
    } finally {
      setIsLoading(false);
    }
  };

  const copyPasskey = () => {
    if (passkey) {
      navigator.clipboard.writeText(passkey);
      toast.success("Passkey copied to clipboard!", {
        duration: 3000,
        position: "top-center",
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
    console.log(`Attempting to join session with passkey: ${joinPasskey}`);
    try {
      const response = await axios.post(
        `${config.url}/api/sessions/join`,
        {
          passkey: joinPasskey,
          username: user.username,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log("Join response:", response.data);
      setPasskey(joinPasskey);
      setIsInSession(true);
      toast.success("Joined session!", {
        duration: 4000,
        position: "top-center",
      });
      connectWebSocket(joinPasskey);
      fetchSessionFiles(joinPasskey);
    } catch (error) {
      console.error("Error in handleJoin:", error.response ? error.response.data : error.message);
      toast.error(
        `Failed to join session: ${error.response?.data || error.message}`,
        {
          duration: 6000,
          position: "top-center",
        }
      );
    } finally {
      setIsLoading(false);
      setJoinPasskey("");
    }
  };

  const connectWebSocket = (passkey) => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
    }

    const socket = new SockJS(`${config.url}/ws`);
    console.log(`Connecting WebSocket to ${config.url}/ws`);

    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log(`Connected to WebSocket for passkey: ${passkey}`);
        client.subscribe(`/topic/session/${passkey}`, (message) => {
          console.log("WebSocket message:", message);
          fetchSessionFiles(passkey);
        });
      },
      onStompError: (frame) => {
        console.error("WebSocket error:", frame);
        toast.error("WebSocket connection failed. Retrying...", {
          duration: 6000,
          position: "top-center",
        });
      },
    });

    client.activate();
    stompClientRef.current = client;
  };

  const fetchSessionFiles = async (passkey) => {
    console.log(`Fetching files for passkey: ${passkey}`);
    try {
      const response = await axios.get(`${config.url}/api/sessions/files/${passkey}`);
      console.log("Files response:", response.data);
      setFiles(response.data);
    } catch (error) {
      console.error("Error in fetchSessionFiles:", error.response ? error.response.data : error.message);
      toast.error(
        `Failed to fetch files: ${error.response?.data || error.message}`,
        {
          duration: 6000,
          position: "top-center",
        }
      );
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

    const validTypes = [
      "image/png",
      "image/jpeg",
      "application/pdf",
      "video/mp4",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error(
        "Unsupported file type. Please upload PNG, JPEG, PDF, MP4, or DOCX.",
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

    const tempId = `temp-${Date.now()}`;
    setUploadProgress((prev) => ({ ...prev, [tempId]: 0 }));

    const formData = new FormData();
    formData.append("file", file);
    try {
      console.log(`Uploading file to ${config.url}/api/sessions/upload/${passkey}/${user.id}`);
      await axios.post(
        `${config.url}/api/sessions/upload/${passkey}/${user.id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress((prev) => ({
              ...prev,
              [tempId]: percentCompleted,
            }));
          },
        }
      );
      toast.success(`Uploaded ${file.name}`, {
        duration: 4000,
        position: "top-center",
      });
      fetchSessionFiles(passkey);
    } catch (error) {
      console.error("Error in handleFileUpload:", error.response ? error.response.data : error.message);
      toast.error(
        `Failed to upload file: ${error.response?.data || error.message}`,
        {
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
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(handleFileUpload);
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      selectedFiles.forEach(handleFileUpload);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    setDownloadProgress((prev) => ({ ...prev, [fileId]: 0 }));
    try {
      console.log(`Downloading file ${fileId} from ${config.url}/api/file/download/${fileId}`);
      const response = await axios.get(`${config.url}/api/file/download/${fileId}`, {
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setDownloadProgress((prev) => ({
            ...prev,
            [fileId]: percentCompleted,
          }));
        },
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${fileName}`, {
        duration: 4000,
        position: "top-center",
      });
    } catch (error) {
      console.error("Error in handleDownload:", error.response ? error.response.data : error.message);
      toast.error(
        `Failed to download file: ${error.response?.data || error.message}`,
        {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full px-4 py-8 bg-gray-50 rounded-3xl shadow-lg animate-fade-in"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-full mb-4 mx-auto"
            >
              <FileUp className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-black mb-2">Connecting...</h1>
            <p className="text-gray-600">Setting up secure session</p>
          </div>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isInSession) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full px-4 py-8 bg-gray-50 rounded-3xl shadow-lg animate-fade-in"
        >
          <div className="text-center mb-8 animate-slide-up">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-full mb-4 mx-auto"
            >
              <Key className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-black mb-2">Secure File Sharing</h1>
            <p className="text-gray-600">Create or join a secure session</p>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <input
                type="text"
                value={passkey}
                readOnly
                placeholder="Generated passkey"
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-full focus:outline-none focus:border-black transition-all duration-300 text-sm ${
                  isLoading
                    ? "bg-gray-100 cursor-not-allowed"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md bg-white"
                }`}
                disabled={isLoading}
              />
              {passkey && (
                <motion.button
                  type="button"
                  onClick={copyPasskey}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-black disabled:opacity-50 transition-colors duration-200"
                >
                  <Copy className="h-5 w-5" />
                </motion.button>
              )}
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={generatePasskey}
              disabled={isLoading || !user}
              className={`w-full py-3 px-6 rounded-full font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 shadow-md ${
                isLoading || !user
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-75"
                  : "bg-black text-white hover:bg-gray-800 hover:shadow-xl active:bg-gray-900"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  <span>Generate Passkey</span>
                </>
              )}
            </motion.button>

            <div className="text-center my-4 text-gray-600">or</div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <input
                type="text"
                value={joinPasskey}
                onChange={(e) => setJoinPasskey(e.target.value)}
                placeholder="Enter passkey"
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-full focus:outline-none focus:border-black transition-all duration-300 text-sm ${
                  isLoading
                    ? "bg-gray-100 cursor-not-allowed"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md bg-white"
                }`}
                disabled={isLoading}
              />
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleJoin}
              disabled={isLoading || !joinPasskey.trim() || !user}
              className={`w-full py-3 px-6 rounded-full font-medium text-sm transition-all duration-300 flex items-center justify-center space-x-2 shadow-md ${
                isLoading || !joinPasskey.trim() || !user
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-75"
                  : "bg-black text-white hover:bg-gray-800 hover:shadow-xl active:bg-gray-900"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  <span>Join Session</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full px-4 py-8 bg-gray-50 rounded-3xl shadow-lg animate-fade-in"
      >
        <div className="text-center mb-8 animate-slide-up">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-full mb-4 mx-auto"
          >
            <Key className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-black mb-2">Secure File Sharing</h1>
          <p className="text-gray-600">Session: {passkey}</p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center mb-8 transition-all duration-300 ${
            isDragging
              ? "border-black bg-gray-100"
              : "border-gray-200 hover:border-gray-300 hover:shadow-md bg-white"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
          <Upload className="h-12 w-12 text-black mx-auto mb-4" />
          <p className="text-black mb-2">Drag & drop files here</p>
          <p className="text-gray-600 mb-4">or</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 rounded-full font-medium text-sm bg-black text-white hover:bg-gray-800 hover:shadow-md transition-all duration-300"
          >
            Browse Files
          </motion.button>
        </div>

        <div className="space-y-4">
          {files.length === 0 && (
            <p className="text-gray-600 text-center">No files shared yet.</p>
          )}
          {files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border-2 border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-black hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center space-x-3">
                <FileUp className="h-6 w-6 text-black" />
                <div>
                  <h3 className="text-black font-medium">{file.fileName}</h3>
                  <p className="text-sm text-gray-600">
                    {(file.size / 1024 / 1024).toFixed(1)} MB • Uploaded by Anonymous
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {(uploadProgress[`temp-${file.id}`] > 0 || downloadProgress[file.id] > 0) && (
                  <div className="w-24 h-2 bg-gray-200 rounded">
                    <div
                      className="h-full bg-black rounded"
                      style={{ width: `${uploadProgress[`temp-${file.id}`] || downloadProgress[file.id] || 0}%` }}
                    />
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDownload(file.id, file.fileName)}
                  className="p-2 text-black hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <Download className="h-5 w-5" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        .pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>

      <style jsx global>{`
        .react-hot-toast {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .react-hot-toast .Toastify__toast {
          padding: 12px 16px;
          border-radius: 12px;
          font-weight: 500;
          backdrop-filter: blur(10px);
        }
        .react-hot-toast .Toastify__toast--success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: 1px solid #059669;
        }
        .react-hot-toast .Toastify__toast--error {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: 1px solid #dc2626;
        }
        .react-hot-toast .Toastify__toast--default {
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
          color: white;
          border: 1px solid #4b5563;
        }
      `}</style>
    </div>
  );
}
}