import { useState, useRef } from 'react';

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
  const [files, setFiles] = useState([
    { id: 1, name: 'presentation.pdf', size: '2.4 MB', uploadDate: '2025-01-15', shared: true, downloads: 12, favorite: false },
    { id: 2, name: 'budget_2025.xlsx', size: '1.8 MB', uploadDate: '2025-01-14', shared: false, downloads: 0, favorite: true },
    { id: 3, name: 'team_photo.jpg', size: '3.2 MB', uploadDate: '2025-01-13', shared: true, downloads: 8, favorite: false },
    { id: 4, name: 'project_notes.docx', size: '890 KB', uploadDate: '2025-01-12', shared: true, downloads: 5, favorite: true }
  ]);
  
  const [uploadModal, setUploadModal] = useState(false);
  const [shareModal, setShareModal] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList).map((file, index) => ({
      id: files.length + index + 1,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploadDate: new Date().toISOString().split('T')[0],
      shared: false,
      downloads: 0,
      favorite: false
    }));
    setFiles([...files, ...newFiles]);
    setUploadModal(false);
  };

  const deleteFile = (id) => {
    setFiles(files.filter(file => file.id !== id));
  };

  const toggleFavorite = (id) => {
    setFiles(files.map(file => 
      file.id === id ? { ...file, favorite: !file.favorite } : file
    ));
  };

  const handleDownload = (file) => {
    setFiles(files.map(f => 
      f.id === file.id ? { ...f, downloads: f.downloads + 1 } : f
    ));
    alert(`Downloading ${file.name}...`);
  };

  const handleView = (file) => {
    alert(`Viewing ${file.name}...`);
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateShareLink = (file) => {
    return `${window.location.origin}/share/${file.id}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Header */}
      <header className="bg-black text-white sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl font-bold text-white">FileShare</h1>
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
                >
                  <GridIcon />
                </button>
                <button 
                  className={`px-3 py-2 transition-all ${viewMode === 'list' ? 'bg-white text-black' : 'text-white hover:bg-gray-600'}`}
                  onClick={() => setViewMode('list')}
                >
                  <ListIcon />
                </button>
              </div>
              <button 
                className="bg-white text-black border border-gray-300 px-4 py-2 rounded-md font-semibold flex items-center gap-2 hover:bg-gray-50 hover:-translate-y-0.5 transition-all"
                onClick={() => setUploadModal(true)}
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
            <div className="text-3xl font-bold text-black mb-2">
              {files.reduce((acc, f) => acc + parseFloat(f.size), 0).toFixed(1)} MB
            </div>
            <div className="text-gray-500 text-sm uppercase tracking-wide">Total Size</div>
          </div>
        </div>
      </div>

      {/* File Grid/List */}
      <main className="max-w-7xl mx-auto px-8 pb-8">
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
          : "flex flex-col gap-2"
        }>
          {filteredFiles.map(file => (
            <div 
              key={file.id} 
              className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:border-black hover:-translate-y-1 hover:shadow-xl transition-all ${
                viewMode === 'grid' 
                  ? 'p-4 flex flex-col items-center text-center min-h-48' 
                  : 'p-4 flex flex-row items-center gap-4'
              }`}
            >
              <div className={`text-gray-500 ${viewMode === 'grid' ? 'mb-3' : ''}`}>
                <FileIcon className={viewMode === 'grid' ? 'w-8 h-8' : 'w-6 h-6'} />
              </div>
              <div className={`flex-1 ${viewMode === 'grid' ? 'mb-3' : ''}`}>
                <h3 className="text-base font-semibold text-black mb-1 break-words leading-tight">{file.name}</h3>
                <p className="text-gray-500 text-sm mb-1">{file.size} • {file.uploadDate}</p>
                <div className="text-xs">
                  {file.favorite && (
                    <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-600 px-2 py-1 rounded-md font-medium mb-1 mr-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                      Favorite
                    </span>
                  )}
                  {file.shared ? (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-black px-2 py-1 rounded-md font-medium">
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
              <div className={`flex gap-2 ${viewMode === 'grid' ? 'justify-center' : ''}`}>
                <button 
                  className={`w-9 h-9 flex items-center justify-center border rounded-lg transition-all hover:-translate-y-0.5 ${
                    file.favorite 
                      ? 'bg-orange-100 border-orange-300 text-orange-600 hover:bg-orange-200' 
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-black hover:text-black'
                  }`}
                  onClick={() => toggleFavorite(file.id)}
                  title={file.favorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {file.favorite ? <FavoriteFilledIcon /> : <FavoriteIcon />}
                </button>
                <button 
                  className="w-9 h-9 flex items-center justify-center bg-white border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 hover:border-black hover:text-black hover:-translate-y-0.5 transition-all"
                  onClick={() => handleView(file)}
                  title="View file"
                >
                  <EyeIcon />
                </button>
                <button 
                  className="w-9 h-9 flex items-center justify-center bg-white border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 hover:border-black hover:text-black hover:-translate-y-0.5 transition-all"
                  onClick={() => handleDownload(file)}
                  title="Download file"
                >
                  <DownloadIcon />
                </button>
                <button 
                  className="w-9 h-9 flex items-center justify-center bg-white border border-gray-300 text-gray-500 rounded-lg hover:bg-red-500 hover:border-red-500 hover:text-white hover:-translate-y-0.5 transition-all"
                  onClick={() => deleteFile(file.id)}
                  title="Delete file"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredFiles.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <FileIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl mb-2 text-black">No files found</h3>
            <p>Upload your first file or adjust your search</p>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setUploadModal(false)}>
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Upload Files</h2>
              <button 
                className="p-1 hover:bg-gray-100 rounded transition-all"
                onClick={() => setUploadModal(false)}
              >
                <XIcon />
              </button>
            </div>
            <div 
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                dragActive ? 'border-black bg-gray-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,5 17,10"/>
                <line x1="12" y1="5" x2="12" y2="15"/>
              </svg>
              <h3 className="text-black mb-2">Drag & Drop files here</h3>
              <p className="text-gray-500 mb-4">or</p>
              <button 
                className="bg-black text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-800 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShareModal(null)}>
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Share File</h2>
              <button 
                className="p-1 hover:bg-gray-100 rounded transition-all"
                onClick={() => setShareModal(null)}
              >
                <XIcon />
              </button>
            </div>
            <div className="text-center">
              <h3 className="text-black mb-4">{shareModal.name}</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={generateShareLink(shareModal)}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
                <button 
                  className="bg-black text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-800 transition-all"
                  onClick={() => copyToClipboard(generateShareLink(shareModal))}
                >
                  Copy
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-600 mb-2">Downloads: {shareModal.downloads}</p>
                <p className="text-gray-600">Shared on: {shareModal.uploadDate}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Drive;