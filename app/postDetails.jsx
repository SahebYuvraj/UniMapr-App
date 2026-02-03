import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '../assets/icons';
import CommentItemComponent from '../components/CommentItemComponent';
import Input from '../components/Input';
import Loading from '../components/Loading';
import PostCard from '../components/PostCard';
import { hp, wp } from '../constants';
import theme from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { createComment, fetchPostDetails, removeComment, removePost } from '../services/postService';
import { getUserData } from '../services/userService';



const PostDetails = () => {
  const {postId} = useLocalSearchParams();
  const {user} = useAuth();
  const router = useRouter();
  const [startLoading, setStartLoading] = useState(true);
  const inputRef =  useRef(null);
  const commentRef =  useRef('');
  const [loading, setLoading] = useState(false);

  const [post, setPost] = useState(null);

  const handleCommentEvent = async (payload) => {
    if(payload.new){
      let newComment = {...payload.new};
      let res = await getUserData(newComment.userid);
      newComment.user = res.success ? res.data : {};
      setPost(prevPost => {
         return {
          ...prevPost,
          comments: [newComment, ...prevPost.comments]
         }
      }
    )
    }
  }

    useEffect(() => {
          let commentChannel = supabase
              .channel('comments')
              .on(
                  'postgres_changes',
                  { event: 'INSERT', schema: 'public', table: 'comments',
                     filter: `postid=eq.${postId}` }, handleCommentEvent)
              .subscribe();
  
          getPostDetails();
  
          return () => {
              supabase.removeChannel(commentChannel);
          }
  
      }, [])
  
  
  const getPostDetails = async () => {
    let res = await fetchPostDetails(postId);
    // console.log('Post details response:', res);
    if(res.success) setPost(res.data);
    setStartLoading(false);
  }

  const onNewComment = async() => {
    if(!commentRef.current) return null;
    let data = {
      userid: user?.id,
      postid: post?.id,
      text: commentRef.current,
    }

    setLoading(true);
    let res = await createComment(data);
    setLoading(false);
    if(res.success) {
      inputRef?.current?.clear();
      commentRef.current = ""; 
    
    }else{
      Alert.alert('Error', res.msg);
    }

  }

  const onDeleteComment = async (comment) => {
    let res = await removeComment(comment?.id);
    if(res.success) {
      setPost(prevPost => {
        let updatedPost = {...prevPost};
        updatedPost.comments = updatedPost.comments.filter(c => c.id !== comment.id);
        return updatedPost;
      })
        
    }else{
      Alert.alert('Error', res.msg);
    }
    
  }

  const onDeletePost = async (item) => {
    console.log('Deleting post:', item);
    let res = await removePost(item?.id);
    if(res.success) {
      router.back();
        
    }else{
      Alert.alert('Error', res.msg);
    }

  }
  const onEditPost = async (item) => {
    router.back();
    router.push ({pathname: 'newPost',params :{...item}})

  }


  if(startLoading) {
    return (
      <View style={styles.center}>
        <Loading/>
      </View>
      )}

      if(!post) {
        return (
          <View style={[styles.center, {justifyContent: 'flex-start', marginTop: 100}]}>
            <Text style={styles.notFound}>Post not found!</Text>
          </View>
        )
      }
  
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} 
      contentContainerStyle={styles.list} >

      <PostCard 
        item={{...post, comments: [{count: post?.comments?.length}]}}
        currentUser={user}
        router = {router}
        hasShadow={false}
        showMoreIcon = {false}
        showDelete = {true}
        onDelete = {onDeletePost}
        onEdit = {onEditPost}

        />

        {/* {/commnet input box/} */}
        <View style={styles.inputContainer}>
          <Input
            inputRef={inputRef}
            placeholder='Add a comment...'
            onChangeText={value => commentRef.current = value}
            placeholderTextColor={theme.colors.textLight}
            containerStyle={{flex:1, height: hp(6.2),borderRadius: theme.radius.xl}} 
            />
            {
              loading ? (<View style={styles.loading}>
                <Loading size = "small" />

              </View>): (
            <TouchableOpacity style={styles.sendIcon} onPress= {onNewComment}>
              <Icon name="send" color={theme.colors.primaryDark} />
            </TouchableOpacity>)
            }

           
           
        </View>
         {/* {/commnet input box/} */}
         <View style = {{marginVertical: 15, gap:17}}>
          {
            post?.comments?.map(comment =>
              <CommentItemComponent 
              key={comment?.id?.toString()}
              item = {comment}
              onDelete = {onDeleteComment}
              canDelete = {user.id == comment?.userid || user.id == post?.userid}
              // this allows the post owner to delete any comment on his post but to change -- canDelete = {user.id == comment?.userid}
               />
            )
          }
          {
            post?.comments?.length == 0 && (
              <Text style={{color: theme.colors.text, marginLeft: 5}}>
               Be the first one to comment!
              </Text>
            )
          }

         </View>

      </ScrollView>


     

    </View>
  )
}


export default PostDetails

// ...existing code...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: wp(7),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  list: {
    paddingHorizontal: wp(4),
  },
  sendIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.8,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    height: hp(5.8),
    width: hp(5.8),
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    fontSize: hp(2.5),
    color: theme.colors.text,
    fontWeight: theme.fonts.medium,
  },
  loading: {
    height: hp(5.8),
    width: hp(5.8),
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 1.3 }],
  },
});
// ...existing code...