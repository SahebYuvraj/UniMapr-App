import { Video } from 'expo-av';
import { Image } from 'expo-image';
import { Ellipsis } from 'lucide-react-native';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RenderHTML from 'react-native-render-html';
import Icon from '../assets/icons';
import { hp, stripHtml, wp } from '../constants';
import theme from '../constants/theme';
import { supabase } from '../lib/supabase';
import { downloadFile, getSupabaseFileUrl } from '../services/imageService';
import { createPostLike, removePostLike } from '../services/postService';
import Avatar from './Avatar';
import Loading from './Loading';





const textStyle = {
    color: theme.colors.textDark,

    fontSize: hp(1.75),
};

const tagsStyles = {
    div: textStyle,
    p: textStyle,
    ol: textStyle,
    h1: {
        color: theme.colors.dark,
    },
    h4: {
        color: theme.colors.dark,
    }

};




const PostCard = ({
    item,
    currentUser,
    router,
    hasShadow = true,
    showMoreIcon = true,
    showDelete = false,
    onDelete=() => {},
    onEdit=() => {},
}) => {
    const shadowStyles ={
        shadowOffset: {width:0, height:2},
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 1,
    }

    const [likes, setLikes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [commentCount, setCommentCount] = useState(item?.comments?.[0]?.count || 0);



    useEffect(() => {
        setLikes(item?.postLikes);
    },[])

    //effect for comment
    useEffect(() => {
            const fetchInitialCount = async () => {
                const { count } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('postid', item?.id);
                setCommentCount(count || 0);
            };
            fetchInitialCount();

            const channel = supabase
                .channel(`comments-changes-${item?.id}`) // unique per post
                .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'comments', filter: `postid=eq.${item?.id}` },
                payload => {
                    if (payload.eventType === 'INSERT') setCommentCount(prev => prev + 1);
                    if (payload.eventType === 'DELETE') setCommentCount(prev => Math.max(prev - 1, 0));
                }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
            }, [item?.id]);
    
    const openPostDetails = () => {
        if(!showMoreIcon) return null;
        router.push({pathname: 'postDetails', params: {postId: item?.id} });
    }

    const onLike = async () => {
        if(liked){
        let updatedLikes = likes.filter(like => like.userid != currentUser?.id);
        setLikes([...updatedLikes]);
        let res = await removePostLike(item?.id, currentUser?.id);
        if(!res.success){
            Alert.alert('Error', res.msg);
        }
        }
        else{
        let data = {
            userid: currentUser?.id,
            postid: item?.id,
        }
        setLikes([...likes, data]);
        let res = await createPostLike(data);
        if(!res.success){
            Alert.alert('Error', res.msg);
        }
    }
    }

    const onShare = async () => {
        let content = {message: stripHtml(item?.body)};
        if(item?.file){
            //downloiad the file then share the uri
            setLoading(true);
            let url = await downloadFile(getSupabaseFileUrl(item?.file).uri);
            setLoading(false);
            content.url = url;
        }
        Share.share(content);
    }

    const handlePostDelete = () => {
         Alert.alert("Confirm Delete","Are you sure you want to delete this?",[
            {
                text:"Cancel",
                onPress:()=> console.log("Cancel Pressed"),
                style:"cancel"
            },
            {
            text:"Delete",
            onPress: () => onDelete(item),
            style:"destructive"
            }
        ])
    }
        

    const createdAt = moment(item?.created_at).format('MMM D');
    
    const liked = likes.filter(like => like.userid == currentUser?.id)[0]? true : false;
    
    
  return (
    <View style={[styles.container, hasShadow && shadowStyles ]}>
        <View style={styles.header}>
            <View style={styles.userInfo}>
                <Avatar 
                    size={hp(4.5)}
                    uri={item.user.image} 
                    rounded = {theme.radius.md}/>
                <View style={{gap:2}}>
                   
                    <Text style={styles.username}>{item.user.name}</Text>
                     <Text style={styles.postTime}>{createdAt}</Text>

                </View>
                
            </View>
            {
                showMoreIcon && (<TouchableOpacity onPress={openPostDetails}>
                {/* <Icon name="threeDotsHorizontal" size={hp(3.4)} strokeWidth={3} color={theme.colors.textLight} /> */}
                <Ellipsis size={hp(2.4)} strokeWidth={2} color={theme.colors.textLight} />

            </TouchableOpacity>)
            }

            {
                showDelete && currentUser.id == item?.userid && (
                    <View style = {styles.actions}>
                        <TouchableOpacity onPress={() => onEdit(item)}>
                        <Icon name="edit" size={hp(2.5)} color={theme.colors.text} />
                        </TouchableOpacity>
                         <TouchableOpacity onPress={handlePostDelete}>
                        <Icon name="delete" size={hp(2.5)} color={theme.colors.rose} />
                        </TouchableOpacity>
                        </View>
                    
                )
                        
            }

            
        </View>
        <View style={styles.content}>
            

            {/* post image */}
            {
                item?.file && item?.file?.includes('postImages') && (
                    <Image
                    source = {getSupabaseFileUrl(item?.file)}
                    transition = {100}
                    style = {styles.postMedia}
                    contentFit = "cover"
                    />
                )
            }

            {/* post video */}
            {
                item?.file && item?.file?.includes('postVideos') && (
                    <Video
                        style={[styles.postMedia, {height: hp(30)}]}
                        source={{ uri: getSupabaseFileUrl(item?.file) }}
                        useNativeControls
                        resizeMode="cover"
                        isLooping
                    />  
                    
                )
            }

            <View style={styles.postBody}>
               {
                 item?.body && (
                    <RenderHTML
                        contentWidth = {wp(100)}
                        source = {{html: item?.body}}
                        tagsStyles={tagsStyles}
                        />

                 )
               }

            </View>

        </View>

        {/* like,share,comment */}
        <View style={styles.footer}>
            <View style = {styles.footerButton}>
                <TouchableOpacity onPress={onLike}>
                    <Icon name="heart" size={24} fill={liked ? theme.colors.rose : 'transparent'} color={liked ? theme.colors.rose : theme.colors.textLight} />
                </TouchableOpacity>
                <Text style={styles.count}>
                    {likes?.length}
                </Text>

            </View>
            <View style = {styles.footerButton}>
                <TouchableOpacity onPress ={openPostDetails}>
                    <Icon name="comment" size={24} color={theme.colors.textLight} />
                </TouchableOpacity>
                <Text style={styles.count}>
                    {commentCount}
                </Text>

            </View>
            <View style = {styles.footerButton}>
            { loading ? (<Loading size="small" />) :(
                <TouchableOpacity onPress ={onShare}>
                    <Icon name="share" size={24} color={theme.colors.textLight} />
                </TouchableOpacity>
            )}
                

            </View>
        </View>

    </View>
  )
}

export default PostCard

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginBottom: 15,
    borderRadius: theme.radius.xxl * 1.1,
    borderCurve: 'continuous',
    padding: 10,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderWidth: 0.5,
    borderColor: theme.colors.gray,
    shadowColor: '#000',
    overflow: 'hidden',
    
    
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    fontSize: hp(1.7),
    color: theme.colors.textDark,
    fontWeight: theme.fonts.medium,
  },
  postTime: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    fontWeight: theme.fonts.medium,
  },
  postBody: {
    marginLeft: 5,
  },
  content: {
    gap: 10,
    // marginBottom: 10,
  },
  postMedia: {
    height: hp(40),
    width: '100%',
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  footerButton: {
    marginLeft: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    color: theme.colors.text,
    fontSize: hp(1.8),
  },
});