'use client';

import { Inbox } from 'lucide-react';
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadToS3, getS3Url } from '@/lib/s3'; // Import the upload functions
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

const FileUpload = () => {

    const {mutate} = useMutation({
      mutationFn: async ({file_key, file_name}:{file_key: string, file_name: string}) => {
        const response = await axios.post('/api/create-chat', {
          file_key, file_name

        })
      }
    })
    const [uploading, setUploading] = React.useState(false);


  const { getInputProps, getRootProps } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];

      if (file.size > 10 * 1024 * 1024) {
        alert('File is too large. Please upload a file less than 10MB');
        return;
      }

      try {
        setUploading(true);
        const data = await uploadToS3(file);
        if(!data?.file_key || !data?.file_name) {
            throw new Error('Upload failed');
            return
        }

      } catch (error) {
        alert('Upload failed. Please try again.');
        console.error('Upload error:', error);
      } finally {
        setUploading(false);
      }
    },
  });

  return (
    <div className="p-4 bg-white rounded-xl shadow-md">
      <div
        {...getRootProps({
          className:
            'border-dashed border-2 border-gray-300 rounded-xl cursor-pointer py-8 flex justify-center items-center flex-col hover:border-blue-500 transition',
        })}
      >
        <input {...getInputProps()} />
        <Inbox className="w-10 h-10 text-blue-500" />
        <p className="mt-2 text-sm text-slate-400">Drag and drop your PDF here</p>
      </div>

    </div>
  );
};

export default FileUpload;
