import React from 'react';
import { File } from 'lucide-react';

export const getFileIcon = (fileName: string): React.ReactNode => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'pdf':
            return <File className="text-red-500" size={24} />;
        case 'doc':
        case 'docx':
            return <File className="text-blue-500" size={24} />;
        case 'xls':
        case 'xlsx':
            return <File className="text-green-500" size={24} />;
        case 'txt':
            return <File className="text-gray-500" size={24} />;
        default:
            return <File className="text-gray-500" size={24} />;
    }
};

