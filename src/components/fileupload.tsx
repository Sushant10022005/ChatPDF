'use client';

import { Inbox, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadToS3, getS3Url } from '@/lib/s3'; // Import the upload functions
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const FileUpload = () => {
    const router = useRouter(); 
    const [uploading, setUploading] = React.useState(false);
    const {mutate, isPending} = useMutation({
      mutationFn: async ({file_key, file_name}:{file_key: string, file_name: string}) => {
        const response = await axios.post('/api/create-chat', {
          file_key, file_name

        });
        return response.data;
      }
    })


  const { getInputProps, getRootProps } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];

      if (file.size > 10 * 1024 * 1024) {
        toast.error('File is too large. Please upload a file less than 10MB');
        return;
      }

      try {
        setUploading(true);
        const data = await uploadToS3(file);
        if (!data?.file_key || !data?.file_name) {
          toast.error('Upload failed');
          return;
        }
        mutate(data, {
          onSuccess: (chat_id) => {
            toast.success('Chat created successfully');
            router.push(`/chat/${chat_id}`);
          },
          onError: (err) => {
            console.error(err);
            toast.error("Error creating chat");
        }
      })

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
        {uploading || isPending ?(
          <>
          {/* loading state */}
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="mt-2 text-sm text-slate-400">Uploading...</p>
          </>
        ):(
        <>
        <Inbox className="w-10 h-10 text-blue-500" />
        <p className="mt-2 text-sm text-slate-400">Drag and drop your PDF here</p>
        </>
      )}
        </div>

    </div>
  );
};

export default FileUpload;
