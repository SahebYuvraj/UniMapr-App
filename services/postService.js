import dayjs from "dayjs";
import customParse from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { supabase } from '../lib/supabase';
import { uploadFile } from './imageService';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParse);


export const createOrUpdatePost = async (post) => {
    try{
        //upload image
        if(post.file && typeof post.file == 'object'){ 
            let isImage = post.file.type === 'image';
            let folderName = isImage ? 'postImages' : 'postVideos';
            let fileResult = await uploadFile(folderName, post?.file?.uri, isImage);
            if(fileResult.success){
                post.file = fileResult.data;
            }
            else{
                return fileResult;
            }
        }

        // create or update post
        const {data, error} = await supabase
            .from('posts')
            .upsert(post)
            .select()
            .single();

        if(error) {
            console.log('Error creating/updating post:', error);
            return {success: false, msg: 'Error creating/updating post'};
        }
        
        return {success: true, data: data};
        

    }
    catch(error){
        console.log('Error creating/updating post:', error);
        return {success: false, msg : 'Error creating/updating post'};
        
    }
}

export const createOrUpdateEvent = async (event) => {
    try{

        if(event.banner && typeof event.banner == 'object'){ 
            let isImage = event.banner.type === 'image';
            let fileResult = await uploadFile('eventBanners', event?.banner?.uri, true);
            if(fileResult.success){
                event.banner = fileResult.data;
                
            }
            else{
                return fileResult;
            }
        }

        const {data, error} = await supabase
            .from('events')
            .upsert(event)
            .select()
            .single();

        if(error) {
            console.log('Error creating/updating event:', error);
            return {success: false, msg: 'Error creating/updating event'};
        }
        
        return {success: true, data: data};
        

    }
    catch(error){
        console.log('Error creating/updating event:', error);
        return {success: false, msg : 'Error creating/updating event'};
        
    }
}


export const fetchPosts = async (limit = 10, userId) => {
    try{
        if(userId){
            const {data, error} = await supabase
            .from('posts')
            .select(`*, user:users (id, name, image), postLikes (*),comments (count)`)
            .order('created_at', {ascending: false})
            .eq('userid', userId)
            .limit(limit);
                    
        if(error) {
            console.log('Error fetching posts:', error);
            return {success: false, msg: 'Error fetching posts'};
        }

        
        return {success: true, data: data};
        }
        else{
            const {data, error} = await supabase
            .from('posts')
            .select(`*, user:users (id, name, image), postLikes (*),comments (count)`)
            .order('created_at', {ascending: false})
            .limit(limit);
                    
        if(error) {
            console.log('Error fetching posts:', error);
            return {success: false, msg: 'Error fetching posts'};
        }

        
        return {success: true, data: data};
        }
        

    }
    catch(error){
        console.log('Error fetching posts', error);
        return {success: false, msg : 'Error fetching posts'};
        
    }
}

export const fetchEvents = async (limit = 10) => {
    try{
        const {data, error} = await supabase
            .from('events')
            .select(`*, organiser:users (id, name, image), eventLikes (*)`)
            .order('created_at', {ascending: false})
            .limit(limit);
                    
        if(error) {
            console.log('Error fetching events:', error);
            return {success: false, msg: 'Error fetching events'};
        }

        
        return {success: true, data: data};
        

    }
    catch(error){
        console.log('Error fetching events', error);
        return {success: false, msg : 'Error fetching events'};
        
    }
}


export const createPostLike = async (postLike) => {
    try{
        const {data, error} = await supabase
            .from('postLikes')
            .insert(postLike)
            .select()
            .single();

        if(error) {
            console.log('Error creating post like:', error);
            return {success: false, msg: 'Error creating post like'};
        }
        
        return {success: true, data: data};
        

    }
    catch(error){
        console.log('Error creating post like', error);
        return {success: false, msg : 'Error creating post like'};
        
    }
}

export const createEventInterest = async (eventInterest) => {
    try{
        const {data, error} = await supabase
            .from('eventLikes')
            .insert(eventInterest)
            .select()
            .single();
        if(error) {
            console.log('Error creating event interest:', error);
            return {success: false, msg: 'Error creating event interest'};
        }
        
        return {success: true, data: data};
        

    }
    catch(error){
        console.log('Error creating event interest', error);
        return {success: false, msg : 'Error creating event interest'};
        
    }
}

export const removePostLike = async (postID, userID) => {
    try{
        const {data, error} = await supabase
            .from('postLikes')
            .delete()
            .eq('postid', postID)
            .eq('userid', userID)
            

        if(error) {
            console.log('Error removing post like:', error);
            return {success: false, msg: 'Error removing post like'};
        }

        return {success: true};

    }
    catch(error){
        console.log('Error removing post like', error);
        return {success: false, msg : 'Error removing post like'};

    }
}

export const removeEventInterest = async (eventID, userID) => {
    try{
        const {data, error} = await supabase
            .from('eventLikes')
            .delete()
            .eq('eventid', eventID)
            .eq('userid', userID);

        if(error) {
            console.log('Error removing event interest:', error);
            return {success: false, msg: 'Error removing event interest'};
        }

        return {success: true};

    }
    catch(error){
        console.log('Error removing event interest', error);
        return {success: false, msg : 'Error removing event interest'};

    }
}

export const fetchPostDetails = async (postId) => {
    try{
        const {data, error} = await supabase
            .from('posts')
            .select(`*, user:users (id, name, image), postLikes (*),comments (*, user:users (id, name, image))`)
            .eq('id', postId)
            .order('created_at', {ascending: false , foreignTable: 'comments'})
            .single();

        if(error) {
            console.log('Error fetching post:', error);
            return {success: false, msg: 'Error fetching post'};
        }
        
        return {success: true, data: data};
        

    }
    catch(error){
        console.log('Error fetching post', error);
        return {success: false, msg : 'Error fetching post'};
        
    }
}

export const createComment = async (comment) => {
    try{
        const {data, error} = await supabase
            .from('comments')
            .insert(comment)
            .select()
            .single();

        if(error) {
            console.log('Error creating comment:', error);
            return {success: false, msg: 'Error creating comment'};
        }
        
        return {success: true, data: data};
        

    }
    catch(error){
        console.log('Error creating comment', error);
        return {success: false, msg : 'Error creating comment'};
        
    }
}



export const removeComment = async (commentId) => {
    try{
        const {error} = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);

        if(error) {
            console.log('Error removing comment:', error);
            return {success: false, msg: 'Error removing comment'};
        }

        return {success: true, data: {commentId}};

    }
    catch(error){
        console.log('Error removing comment', error);
        return {success: false, msg : 'Error removing comment'};

    }
}

export const removePost = async (postid) => {
    try{
        const {error} = await supabase
            .from('posts')
            .delete()
            .eq('id', postid);

        if(error) {
            console.log('Error removing post:', error);
            return {success: false, msg: 'Error removing post'};
        }

        return {success: true, data: {postid}};

    }
    catch(error){
        console.log('Error removing post', error);
        return {success: false, msg : 'Error removing post'};

    }
}

export const fetchInterestedEvents = async (userId, limit = 10) => {
  try {
    // 1. Query the eventLikes table FIRST (child table)
    const { data, error } = await supabase
      .from("eventLikes")
      .select(`
        *,
        event:events (
          *,
          organiser:users (id, name, image),
          eventLikes (*)
        )
      `)
      .eq("userid", userId)
      .limit(limit);

    if (error) {
      console.log("Error fetching interested events:", error);
      return { success: false, msg: "Error fetching interested events" };
    }

    // 2. Extract ONLY the event objects
    const events = data.map(row => row.event);

    return { success: true, data: events };

  } catch (err) {
    console.log("Error fetching interested events:", err);
    return { success: false, msg: "Error fetching interested events" };
  }
};




 