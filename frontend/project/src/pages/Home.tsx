import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Upload, File, X, FolderOpen, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  path?: string;
}

const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [manualPath, setManualPath] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<string[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setIsUploading(true);
    setResult(null);
    setSubmitError(null);
    setSelectedFile(acceptedFiles[0] || null); // Only allow one file for testing
    
    setTimeout(() => {
      const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
        id: Date.now().toString() + Math.random().toString(36),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
      }));

      setUploadedFiles(prev => [...prev, ...newFiles]);
      setIsUploading(false);
      toast.success(`${acceptedFiles.length} file(s) uploaded successfully!`);
    }, 1000);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const handleManualPathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPath.trim()) return;

    const pathParts = manualPath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: fileName || 'Unknown File',
      size: 0,
      type: 'path',
      uploadDate: new Date().toISOString(),
      path: manualPath,
    };

    setUploadedFiles(prev => [...prev, newFile]);
    setManualPath('');
    toast.success('File path added successfully!');
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
    toast.success('File removed successfully!');
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setSubmitError('Please upload a file to test.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await fetch('http://localhost:5000/detect-attacks', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setResult(data.attack_ports || []);
      } else {
        setSubmitError(data.error || 'Unknown error occurred.');
      }
    } catch (err) {
      setSubmitError('Failed to connect to backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.fullName}! 👋
              </h1>
              <p className="text-gray-600">
                Upload and manage your files with ease
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Upload className="w-6 h-6" />
                File Upload
              </h2>

              {/* Drag & Drop Area */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="mb-4">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  {isUploading ? (
                    <div className="text-blue-600 font-medium">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      Uploading files...
                    </div>
                  ) : isDragActive ? (
                    <p className="text-blue-600 font-medium">Drop the files here...</p>
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-2">
                        Drag & drop files here, or click to select
                      </p>
                      <p className="text-sm text-gray-500">
                        Support for multiple files
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button and Result Display */}
              <div className="mt-6 flex flex-col gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !selectedFile}
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Testing...' : 'Test Uploaded File'}
                </button>
                {submitError && (
                  <div className="text-red-600 font-medium">{submitError}</div>
                )}
                {result && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-bold text-green-700 mb-2">Detected Attack Ports:</h4>
                    {result.length === 0 ? (
                      <div className="text-gray-700">No attack ports detected.</div>
                    ) : (
                      <ul className="list-disc list-inside text-green-800">
                        {result.map((port, idx) => (
                          <li key={idx}>{port}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Manual Path Input */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Or Enter File Path Manually
                </h3>
                <form onSubmit={handleManualPathSubmit} className="flex gap-3">
                  <input
                    type="text"
                    value={manualPath}
                    onChange={(e) => setManualPath(e.target.value)}
                    placeholder="e.g., /home/user/documents/file.pdf"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                  >
                    Add Path
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Files List */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <File className="w-6 h-6" />
                Uploaded Files ({uploadedFiles.length})
              </h2>

              {uploadedFiles.length === 0 ? (
                <div className="text-center py-8">
                  <File className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No files uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="bg-white/60 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <File className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <h3 className="font-medium text-gray-900 truncate">
                              {file.name}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-500 mb-1">
                            {formatFileSize(file.size)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(file.uploadDate)}
                          </p>
                          {file.path && (
                            <p className="text-xs text-blue-600 mt-1 font-mono truncate">
                              {file.path}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;