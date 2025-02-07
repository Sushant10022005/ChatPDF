'use client'
import { Inbox } from 'lucide-react';
import React from 'react'
import {useDropzone} from 'react-dropzone';


const fileupload = () => {
    const {getInputProps, getRootProps} = useDropzone({
        accept: {'application/pdf': ['.pdf'] },
        maxFiles: 1,
        onDrop: (acceptedFiles) => {
            console.log(acceptedFiles)
        }
    })
  return (
    <div className='p-2 bg-white rounded-xl'>
        <div {...getRootProps({className: 'border-dashed border-2 border-gray-50 rounded-xl cursor-pointer py-8 flex justify-center items-center flex-col'})} >
            <input {...getInputProps({className: ''})}/>
            <>
            <Inbox className='w-10 h-10 text-blue-500'/>
            <p className='mt-2 text-sm text-slate-400'>Drag and drop your PDF here</p>
            </>
        </div>
    </div>
  )
}

export default fileupload;