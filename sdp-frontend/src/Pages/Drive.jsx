import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import config from '../../config';

// Professional SVG vector icons
const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,5 17,10"/>
    <line x1="12" y1="5" x2="12" y2="15"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,15 17,10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const FavoriteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </svg>
);

const FavoriteFilledIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </svg>
);

const FileIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3,6 5,6 21,6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

function Drive() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [shareModal, setShareModal] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [downloadProgress, setDownloadProgress] = useState({});
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  // Get user from localStorage or context and fetch files
  useEffect(() => {
    const getUserAndFetchFiles = async () => {
      try {
        // Try to get user from localStorage (adjust based on your auth implementation)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          await fetchFiles(parsedUser);
        } else {
          // Alternative: Get from auth context or make API call
          // const response = await axios.get(`${config.url}/api/auth/me`);
          // const userData = response.data;
          // localStorage.setItem('user', JSON.stringify(userData));
          // setUser(userData);
          // await fetchFiles(userData);
          
          // For now, redirect to login or show error
          setError('User not authenticated. Please log in.');
          toast.error('Please log in to access your files');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to authenticate user');
        toast.error('Authentication failed. Please log in.');
      }
    };

    getUserAndFetchFiles();
  }, []);

  const fetchFiles = async (currentUser) => {
    if (!currentUser?.username) {
      setError('No username available');
      toast.error('No username available');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${config.url}/api/file/viewall/${currentUser.username}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Add if using JWT
        }
      });

      const fetchedFiles = Array.isArray(response.data) ? response.data : [];

      if (fetchedFiles.length === 0) {
        // Fixed: Use toast with type option instead of toast.info
        toast('No files found. Upload your first file!', { 
          type: 'info',
          duration: 4000 
        });
      }

      const transformedFiles = fetchedFiles.map((file) => {
        const fileExtension = file.fileName?.split('.').pop()?.toLowerCase() || '';
        const sizeInMB = file.size ? (file.size / 1024 / 1024).toFixed(1) : 0;
        const sizeDisplay = sizeInMB >= 1 ? `${sizeInMB} MB` : `${(file.size / 1024).toFixed(0)} KB`;
        
        return {
          id: file.id,
          name: file.fileName || file.name || 'Untitled',
          size: sizeDisplay,
          uploadDate: file.uploadDate ? new Date(file.uploadDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          shared: file.isShared || false,
          downloads: file.downloads || 0,
          favorite: file.isFavourite || false,
          extension: fileExtension,
          previewUrl: null,
          originalSize: file.size || 0, // Store original size for calculations
        };
      });

      setFiles(transformedFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to load files from server');
      toast.error(`Failed to load files: ${error.response?.data?.message || error.message}`);
      setFiles([]); // Empty array instead of mock data
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (fileList) => {
    if (!user) {
      toast.error('User not authenticated. Please log in.');
      return;
    }

    const filesArray = Array.from(fileList);
    
    // Validation
    const validTypes = [
      'image/png', 'image/jpeg', 'image/jpg',
      'application/pdf',
      'video/mp4',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    const validFiles = filesArray.filter(file => {
      if (!validTypes.includes(file.type) && !file.type.startsWith('image/') && !file.type.startsWith('application/')) {
        toast.error(`Unsupported file type: ${file.name}`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB - max 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      setUploadModal(false);
      return;
    }

    // Show upload summary
    toast.loading(`Uploading ${validFiles.length} file(s)...`, { id: 'upload-summary' });

    for (const file of validFiles) {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const fileExtension = file.name.split('.').pop().toLowerCase();
      let previewUrl = null;

      if (['png', 'jpg', 'jpeg', 'gif'].includes(fileExtension)) {
        previewUrl = window.URL.createObjectURL(file);
      }

      const newFile = {
        id: tempId,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadDate: new Date().toISOString().split('T')[0],
        shared: false,
        downloads: 0,
        favorite: false,
        extension: fileExtension,
        previewUrl,
        isUploading: true,
        originalSize: file.size,
      };

      setFiles(prev => [...prev, newFile]);
      setUploadProgress(prev => ({ ...prev, [tempId]: 0 }));

      const formData = new FormData();
      formData.append('file', file);
      if (user.id) {
        formData.append('userId', user.id);
      }

      try {
        const uploadUrl = `${config.url}/api/file/upload/${user.id || user.username}`;
        const response = await axios.post(uploadUrl, formData, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(prev => ({ ...prev, [tempId]: percentCompleted }));
            }
          },
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Add if using JWT
          },
          timeout: 30000, // 30 second timeout
        });

        const uploadedFileData = response.data;
        const uploadedFile = {
          ...newFile,
          id: uploadedFileData.id || tempId,
          size: newFile.size,
          isUploading: false,
          shared: uploadedFileData.isShared || false,
          downloads: uploadedFileData.downloads || 0,
          favorite: uploadedFileData.isFavourite || false,
          originalSize: file.size,
        };

        setFiles(prev => prev.map(f => f.id === tempId ? uploadedFile : f));
        toast.success(`${file.name} uploaded successfully`, { id: `upload-${tempId}` });
        
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}: ${error.response?.data?.message || error.message}`, { 
          id: `upload-${tempId}`,
          duration: 5000 
        });
        setFiles(prev => prev.filter(f => f.id !== tempId));
      } finally {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[tempId];
          return newProgress;
        });
        if (previewUrl) {
          window.URL.revokeObjectURL(previewUrl);
        }
      }
    }

    toast.dismiss('upload-summary');
    
    // Refresh the complete file list after all uploads
    setTimeout(() => {
      fetchFiles(user);
    }, 1000);
    
    setUploadModal(false);
  };

  const deleteFile = async (id) => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      await axios.delete(`${config.url}/api/file/delete/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Add if using JWT
        }
      });
      toast.success('File deleted successfully');
      await fetchFiles(user);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file: ' + (error.response?.data?.message || error.message));
    }
  };

  const toggleFavorite = async (id) => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const file = files.find(f => f.id === id);
      if (!file) return;

      const newFavoriteStatus = !file.favorite;
      await axios.put(`${config.url}/api/users/file/favourite/${id}/${newFavoriteStatus ? 1 : 0}`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Add if using JWT
        }
      });
      
      toast.success(newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites');
      await fetchFiles(user);
    } catch (error) {
      console.error('Favorite toggle error:', error);
      toast.error('Failed to update favorite status: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDownload = async (file) => {
    if (!file || !user) {
      toast.error('Cannot download: User not authenticated');
      return;
    }

    setDownloadProgress(prev => ({ ...prev, [file.id]: 0 }));
    
    try {
      const response = await axios.get(`${config.url}/api/file/download/${file.id}`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Add if using JWT
        },
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setDownloadProgress(prev => ({ ...prev, [file.id]: percentCompleted }));
          }
        },
      });

      const contentType = response.headers['content-type'];
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Update download count locally (server should handle this)
      const updatedFile = { ...file, downloads: file.downloads + 1 };
      setFiles(prev => prev.map(f => f.id === file.id ? updatedFile : f));
      
      toast.success(`Downloaded: ${file.name}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file: ' + (error.response?.data?.message || error.message));
    } finally {
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.id];
        return newProgress;
      });
    }
  };

  const handleView = async (file) => {
    if (!file || !user) {
      toast.error('Cannot view file: User not authenticated');
      return;
    }

    try {
      const fileExtension = file.extension || file.name.split('.').pop().toLowerCase();
      const isImage = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(fileExtension);
      const isPDF = fileExtension === 'pdf';
      const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(fileExtension);

      const response = await axios.get(`${config.url}/api/file/download/${file.id}`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Add if using JWT
        },
      });

      const contentType = response.headers['content-type'];
      const blob = new Blob([response.data], { type: contentType });

      if (isImage || isPDF || isVideo) {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        toast.success(`Opened: ${file.name}`);
      } else {
        // For other file types, trigger download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', file.name);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        // Fixed: Use toast with type option instead of toast.info
        toast(`${file.name} downloaded (cannot be viewed in browser)`, { 
          type: 'info',
          duration: 4000 
        });
      }
    } catch (error) {
      console.error('View error:', error);
      toast.error('Failed to view file: ' + (error.response?.data?.message || error.message));
      // Fallback to download
      await handleDownload(file);
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateShareLink = (file) => {
    return `${window.location.origin}/share/${file.id}`;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Share link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy link');
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  const getFileIcon = (file) => {
    const extension = file.extension || file.name.split('.').pop().toLowerCase();
    
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(extension)) {
      return (
        <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21,15 16,10 5,21"/>
        </svg>
      );
    }
    
    if (['pdf'].includes(extension)) {
      return (
        <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      );
    }
    
    if (['doc', 'docx'].includes(extension)) {
      return (
        <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      );
    }
    
    if (['xls', 'xlsx'].includes(extension)) {
      return (
        <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      );
    }
    
    if (['ppt', 'pptx'].includes(extension)) {
      return (
        <svg className="w-6 h-6 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="10" rx="2"/>
          <polyline points="12,2 12,7 8,10 12,7 12,12 16,10 12,7 12,2"/>
        </svg>
      );
    }
    
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(extension)) {
      return (
        <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="10" rx="2"/>
          <polyline points="18,7 22,11 18,15"/>
          <polyline points="6,7 2,11 6,15"/>
        </svg>
      );
    }
    
    return <FileIcon className="w-6 h-6 text-gray-500" />;
  };

  // Calculate total size in MB
  const calculateTotalSize = () => {
    return files.reduce((acc, file) => {
      if (file.originalSize) {
        const sizeInMB = file.originalSize / 1024 / 1024;
        return acc + sizeInMB;
      }
      return acc;
    }, 0).toFixed(1);
  };

  if (error && files.length === 0) {
    return (
      <div className="min-h-screen bg-white text-black font-sans flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XIcon style={{ width: '24px', height: '24px', color: '#ef4444' }} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-black text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-800 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading && files.length === 0) {
    return (
      <div className="min-h-screen bg-white text-black font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Header */}
      <header className="bg-black text-white sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-white">FileShare</h1>
              {user && (
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                  {user.username || user.email}
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              <div className="flex items-center bg-white border border-gray-300 rounded-full px-5 py-2 min-w-80 shadow-sm focus-within:border-black focus-within:shadow-md transition-all">
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-none outline-none flex-1 text-black placeholder-gray-500"
                />
              </div>
              <div className="flex bg-gray-700 rounded-md overflow-hidden">
                <button 
                  className={`px-3 py-2 transition-all ${viewMode === 'grid' ? 'bg-white text-black' : 'text-white hover:bg-gray-600'}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  <GridIcon />
                </button>
                <button 
                  className={`px-3 py-2 transition-all ${viewMode === 'list' ? 'bg-white text-black' : 'text-white hover:bg-gray-600'}`}
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  <ListIcon />
                </button>
              </div>
              <button 
                className="bg-white text-black border border-gray-300 px-4 py-2 rounded-md font-semibold flex items-center gap-2 hover:bg-gray-50 hover:-translate-y-0.5 transition-all"
                onClick={() => setUploadModal(true)}
                disabled={!user}
              >
                <PlusIcon /> Upload
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-3xl font-bold text-black mb-2">{files.length}</div>
            <div className="text-gray-500 text-sm uppercase tracking-wide">Total Files</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-3xl font-bold text-black mb-2">{files.filter(f => f.favorite).length}</div>
            <div className="text-gray-500 text-sm uppercase tracking-wide">Favorites</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-3xl font-bold text-black mb-2">{files.reduce((acc, f) => acc + f.downloads, 0)}</div>
            <div className="text-gray-500 text-sm uppercase tracking-wide">Downloads</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-3xl font-bold text-black mb-2">{calculateTotalSize()} MB</div>
            <div className="text-gray-500 text-sm uppercase tracking-wide">Total Size</div>
          </div>
        </div>
      </div>

      {/* File Grid/List */}
      <main className="max-w-7xl mx-auto px-8 pb-8">
        {loading && files.length > 0 && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <span className="ml-2 text-gray-500">Refreshing...</span>
          </div>
        )}
        
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
          : "flex flex-col gap-2"
        }>
          {filteredFiles.map(file => {
            const progress = uploadProgress[file.id] || downloadProgress[file.id] || 0;
            return (
              <div 
                key={file.id} 
                className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:border-black hover:-translate-y-1 hover:shadow-xl transition-all relative group ${
                  viewMode === 'grid' 
                    ? 'p-4 flex flex-col items-center text-center min-h-48' 
                    : 'p-4 flex flex-row items-center gap-4'
                } ${file.isUploading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {/* Progress bar for uploading/downloading */}
                {progress > 0 && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-xl">
                    <div 
                      className="h-full bg-blue-500 rounded-t-xl transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
                
                {/* Uploading indicator */}
                {file.isUploading && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    Uploading...
                  </div>
                )}
                
                <div className={`text-gray-500 flex-shrink-0 ${viewMode === 'grid' ? 'mb-3' : ''}`}>
                  {getFileIcon(file)}
                </div>
                <div className={`flex-1 ${viewMode === 'grid' ? 'mb-3' : ''}`}>
                  <h3 
                    className="text-base font-semibold text-black mb-1 break-words leading-tight hover:text-blue-600 transition-colors"
                    title={file.name}
                  >
                    {file.name.length > 30 ? `${file.name.substring(0, 30)}...` : file.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-1">{file.size} • {file.uploadDate}</p>
                  <div className="text-xs space-y-1">
                    {file.favorite && (
                      <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-600 px-2 py-1 rounded-md font-medium">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                        </svg>
                        Favorite
                      </span>
                    )}
                    {file.shared ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-600 px-2 py-1 rounded-md font-medium">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="18" cy="5" r="3"/>
                          <circle cx="6" cy="12" r="3"/>
                          <circle cx="18" cy="19" r="3"/>
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                        </svg>
                        Shared • {file.downloads} downloads
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <circle cx="12" cy="16" r="1"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        Private
                      </span>
                    )}
                  </div>
                </div>
                <div className={`flex gap-2 ${viewMode === 'grid' ? 'justify-center w-full mt-auto' : ''}`}>
                  <button 
                    className={`w-9 h-9 flex items-center justify-center border rounded-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                      file.favorite 
                        ? 'bg-orange-100 border-orange-300 text-orange-600 hover:bg-orange-200' 
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-black hover:text-black'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!file.isUploading) toggleFavorite(file.id);
                    }}
                    title={file.favorite ? "Remove from favorites" : "Add to favorites"}
                    disabled={file.isUploading || !user}
                  >
                    {file.favorite ? <FavoriteFilledIcon /> : <FavoriteIcon />}
                  </button>
                  <button 
                    className="w-9 h-9 flex items-center justify-center bg-white border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!file.isUploading) handleView(file);
                    }}
                    title="View file"
                    disabled={file.isUploading || !user}
                  >
                    <EyeIcon />
                  </button>
                  <button 
                    className="w-9 h-9 flex items-center justify-center bg-white border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 hover:border-green-500 hover:text-green-500 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!file.isUploading) handleDownload(file);
                    }}
                    title="Download file"
                    disabled={file.isUploading || !user}
                  >
                    <DownloadIcon />
                  </button>
                  <button 
                    className="w-9 h-9 flex items-center justify-center bg-white border border-gray-300 text-gray-500 rounded-lg hover:bg-red-500 hover:border-red-500 hover:text-white hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!file.isUploading && window.confirm(`Delete "${file.name}"? This action cannot be undone.`)) {
                        deleteFile(file.id);
                      }
                    }}
                    title="Delete file"
                    disabled={file.isUploading || !user}
                  >
                    <TrashIcon />
                  </button>
                  {file.shared && (
                    <button 
                      className="w-9 h-9 flex items-center justify-center bg-white border border-gray-300 text-gray-500 rounded-lg hover:bg-blue-500 hover:border-blue-500 hover:text-white hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareModal(file);
                      }}
                      title="Share file"
                      disabled={file.isUploading || !user}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="18" cy="5" r="3"/>
                        <circle cx="6" cy="12" r="3"/>
                        <circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredFiles.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl mb-2 text-black">No files found</h3>
            <p className="mb-6">Your files will appear here once uploaded</p>
            <button 
              onClick={() => setUploadModal(true)}
              className="bg-black text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-800 transition-all"
              disabled={!user}
            >
              Upload Your First File
            </button>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setUploadModal(false)}>
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Upload Files</h2>
              <button 
                className="p-1 hover:bg-gray-100 rounded transition-all"
                onClick={() => setUploadModal(false)}
                title="Close"
              >
                <XIcon />
              </button>
            </div>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 sm:p-12 text-center transition-all ${
                dragActive ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <UploadIcon style={{ width: '48px', height: '48px', color: dragActive ? '#000' : '#9CA3AF' }} className="mx-auto mb-4" />
              <h3 className={`text-lg font-medium mb-2 ${dragActive ? 'text-black' : 'text-gray-900'}`}>
                {dragActive ? 'Drop files here' : 'Drag & Drop files here'}
              </h3>
              <p className="text-gray-500 mb-4">or</p>
              <p className="text-xs text-gray-500 mb-6">
                Supported: Images, PDF, Word, Excel, PowerPoint, Videos (Max 10MB per file)
              </p>
              <button 
                className="bg-black text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => fileInputRef.current?.click()}
                disabled={!user}
              >
                Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf,video/*,application/msword,application/vnd.openxmlformats-officedocument.*,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
                disabled={!user}
              />
            </div>
            {!user && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">Please log in to upload files</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShareModal(null)}>
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Share File</h2>
              <button 
                className="p-1 hover:bg-gray-100 rounded transition-all"
                onClick={() => setShareModal(null)}
                title="Close"
              >
                <XIcon />
              </button>
            </div>
            <div className="text-center">
              <h3 className="text-black mb-4 truncate" title={shareModal.name}>{shareModal.name}</h3>
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={generateShareLink(shareModal)}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
                />
                <button 
                  className="bg-black text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-800 transition-all whitespace-nowrap"
                  onClick={() => copyToClipboard(generateShareLink(shareModal))}
                >
                  Copy Link
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                <p className="text-gray-600 text-sm flex items-center justify-between">
                  <span>Downloads:</span>
                  <span className="font-medium">{shareModal.downloads}</span>
                </p>
                <p className="text-gray-600 text-sm flex items-center justify-between">
                  <span>Uploaded:</span>
                  <span className="font-medium">{shareModal.uploadDate}</span>
                </p>
                <p className="text-gray-600 text-sm flex items-center justify-between">
                  <span>Size:</span>
                  <span className="font-medium">{shareModal.size}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Drive;