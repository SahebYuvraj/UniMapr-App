import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { supabaseUrl } from '../constants';
import { supabase } from '../lib/supabase';

export const getUserImageSrc = imagePath => {
    if(imagePath){
        return getSupabaseFileUrl(imagePath);
    }
    return require('../assets/images/defaultUser.png')
    }

    export const getSupabaseFileUrl = (filePath) => {
        if(!filePath) return null;
        return {uri:`${supabaseUrl}/storage/v1/object/public/uploads/${filePath}`};
    }

    export const downloadFile = async (url) => {
        try{
            const {uri} = await FileSystem.downloadAsync(url, getLocalFilePath(url));
            return uri;
        }
        catch(error){
            return null;

    }
}

export const getLocalFilePath = filePath => {
    let fileName = filePath.split('/').pop();
    return `${FileSystem.documentDirectory}${fileName}`;
}


export const uploadImage = async (folderName,fileUri,isImage=true) => {

    try{
        let fileName = getFilePath(folderName, isImage);
        const fileBased64 = await FileSystem.readAsStringAsync(fileUri, {encoding:FileSystem.EncodingType.Base64});
        let imageData = decode(fileBased64); //arraybuffer
        let {data,error} = await supabase
        .storage
        .from('uploads')
        .upload(fileName,imageData,{
            cacheControl:'3600',
            upsert:false,
            contentType: isImage ? 'image/*' : 'video/*',
            
        });
        if(error){
            console.log('file upload error:', error);
            return {success:false,msg:error.message};
        }


        return {success:true,data: data.path};
    }
    catch(error){
        console.log('file upload error:', error);
        return {success:false,msg:error.message};
    }

}

export const uploadFile = async (folderName,fileUri,isImage=true) => {
    
    try{
        let fileName = getFilePath(folderName, isImage);
        const fileBased64 = await FileSystem.readAsStringAsync(fileUri,
             {encoding:FileSystem.EncodingType.Base64});
        let fileData = decode(fileBased64);
        let {data,error} = await supabase
        .storage
        .from('uploads')
        .upload(fileName,fileData,{
            cacheControl:'3600',
            upsert:false,
            contentType: isImage ? 'image/*' : 'video/*',
            
        });
        if(error){
            console.log('file upload error:', error);
            return {success:false,msg:error.message};
        }

        return {success:true,data: data.path};
    }
    catch(error){
        console.log('file upload error:', error);
        return {success:false,msg:error.message};
    }

}

export const getFilePath = (folderName,isImage) => {
    return `${folderName}/${Date.now()}${isImage ? '.png' : '.mp4'}`;

    //profiles/1679876543210.png
    //images/1679876543210.png
}