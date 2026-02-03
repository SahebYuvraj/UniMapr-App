import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '../../assets/icons';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import Header from '../../components/Header';
import RichTextEditor from '../../components/RichTextEditor';
import ScreenWrapper from '../../components/ScreenWrapper';
import { hp, wp } from '../../constants';
import theme from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { getSupabaseFileUrl } from '../../services/imageService';
import { createOrUpdatePost } from '../../services/postService';





const NewPost = () => {
  const post = useLocalSearchParams();
  const {user} = useAuth();
  const bodyRef = useRef("");
  const editorRef = useRef(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file , setFile] = useState (null);
  const [mode, setMode] = useState('post'); // 'post or event'
  const [eventData, setEventData] = useState({ title: '', description: '' });


  useEffect(() => {
    if(post && post.id){
      bodyRef.current = post.body;
      setFile(post.file || null);
      setTimeout(() => {
        editorRef.current?.setContentHTML(post.body);
      }, 300);
      
    }

  }, [])


  
  const isLocalFile = file => {
    if(!file) return null;
    if(typeof file == 'object') return true;

    return false;
  }

  const getFileType = file => {
    if(!file) return null;
    if(isLocalFile(file)) {
      return file.type;
    }

    // check image or video for remote files
    if(file.includes('postImages')){
      return 'image';
    }

    return 'video';


  }

  const getFileUri = file => {
    if(!file) return null;
    if(isLocalFile(file)) {
      return file.uri;
    }
    
    return getSupabaseFileUrl(file)?.uri;
  }
 //ai coded part since video player not working properly
  const player = useVideoPlayer(
  file && getFileType(file) === 'video' ? getFileUri(file) : null,
  (p) => {
    if (p) p.loop = true;
  }
);



  const onSubmit = async () => {

    if(!bodyRef.current && !file) {
      Alert.alert ("Please add some content to your post!");
      return;
    }
    let data = {
      file,
      body: bodyRef.current,
      userid: user?.id,
    }

    if(post && post.id){
      data.id = post.id;
    }

    // create post
    setLoading(true);
    let res = await createOrUpdatePost(data);
    setLoading(false);

    if(res.success) {
      setFile(null);
      bodyRef.current = "";
      editorRef.current?.setContentHTML("");
      router.back();
      
    }
    else {
      Alert.alert("Error creating post:", res.msg);
    }


    


    // console.log('body:', bodyRef.current);
    // console.log('file:', file);
  }



  const onPick = async (isImage) => {
    let mediaConfig = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4,3],
      quality: 1,
    }

    if(!isImage){
      mediaConfig ={
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
      }
    }
    let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);

    // console.log('file:',result.assets[0])
    if (!result.canceled) {
        setFile(result.assets[0]);
    }

  }
  // console.log('file uri:', getFileUri(file));
  return (
    <ScreenWrapper>
     <View style={styles.container}>
      <Header title="Create new post" />
      <ScrollView contentContainerStyle={{gap:20}}>

      
        <View style={styles.header}>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar
              uri = {user?.image}
              size={hp(6.5)}
              rounded = {theme.radius.xl}
              />

          <View style = {{gap:2}}>
            <Text style={styles.username}>{ user && user?.name}</Text>

            <Text style={styles.publicText}>Public</Text>
          </View>
        </View>

         {/* RIGHT SIDE: Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              onPress={() => setMode('post')}
              style={[
                styles.toggleButton,
                mode === 'post' && styles.toggleButtonActive
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === 'post' && styles.toggleTextActive
                ]}
              >
                Post
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              // onPress={() => setMode('event')}
              onPress={() => router.push('/newEvent')}
              style={[
                styles.toggleButton,
                mode === 'event' && styles.toggleButtonActive
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === 'event' && styles.toggleTextActive
                ]}
              >
                Event
              </Text>
            </TouchableOpacity>
          </View>


        </View>



        {/* text editor */}
        {mode === 'post' && (
        <View style={styles.textEditor}>
          <RichTextEditor editorRef={editorRef} onChange={body => bodyRef.current = body} />
        </View> )}

        {mode === 'event' && (


        <View style={styles.textEditor}>
        <Text>Event form goes here</Text>
        
          <RichTextEditor editorRef={editorRef} placeholder="Describe your event here..." onChange={body => bodyRef.current = body} />
        </View> )}

        {file && (
          <View style = {styles.file}>
            {
              getFileType(file) === 'video' && player ? (
                <VideoView
                  player={player}
                  style={{flex:1}}
                  allowsFullscreen
                  allowsPictureInPicture
                />

                ) : 
                (<Image source ={{uri: getFileUri(file)}} resizeMode="cover" style={{flex:1}} />)
            }

            <Pressable style={styles.closeIcon} onPress={() => setFile(null)}>
              <Icon name = "delete" size={20} color = "white" />
            </Pressable>

           </View>
        )}


        <View style = {styles.media}>
          <Text style = {styles.addImageText}>Add to your post</Text>
          <View style = {styles.mediaIcons}>
            <TouchableOpacity onPress={() => onPick(true)}>
               <Icon name="image" size = {30} color={theme.colors.dark} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onPick(false)}>
               <Icon name="video" size = {30} color={theme.colors.dark} />
            </TouchableOpacity>
          </View>
            
        </View>



      </ScrollView>
      <Button buttonStyle ={{height:hp(6.2)}}
        title = {post && post.id ? "Update": "Post"}
        loading = {loading}
        hasShadow = {false}
        onPress = {onSubmit}/>

    </View>

    </ScreenWrapper>
  )
}

export default NewPost

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'red',
    marginBottom: 30,
    paddingHorizontal: wp(4),
    gap: 15,
  },
  title: {
    // marginBottom: 10,
    fontSize: hp(2.5),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  username: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  avatar: {
    height: hp(6.5),
    width: hp(6.5),
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  publicText: {
    fontSize: hp(1.7),
    fontWeight: theme.fonts.medium,
    color: theme.colors.textLight,
  },
  textEditor: {
    marginTop: 10,
    minHeight: hp(35),
    // Add more text editor styles here
  },
  media: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    padding: 12,
    paddingHorizontal: 18,
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    borderColor: theme.colors.gray,

  },
  mediaIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  addImageText: {
    fontSize: hp(1.9),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  imageIcon: {
    // backgroundColor: theme.colors.gray,
    borderRadius: theme.radius.md,
    // padding: 6,
  },
  file: {
    height: hp(30),
    width: '100%',
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  video: {
    // Add video styles here if needed
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 7,
    borderRadius: 50,
    backgroundColor: 'rgba(255,0,0,0.6)',
    // shadowColor: theme.colors.textLight,
    // shadowOffset: { width: 0, height: 3 },
    // shadowOpacity: 0.6,
    //shadowRadius: 8,
  },
  toggleContainer: {
   flexDirection: 'row',
  padding: 4,
  borderRadius: 50,
  backgroundColor: 'rgba(255, 255, 255, 0.07)', // frosted background
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.12)',
},

toggleButton: {
  paddingVertical: 6,
  paddingHorizontal: 16,
  borderRadius: 50,
  backgroundColor: 'rgba(255, 255, 255, 0.12)', // subtle glass-white tint
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.25)',    // frosted border
},

toggleButtonActive: {
  backgroundColor: 'rgba(9, 116, 238, 0.5)', // your color w/ glass opacity
  borderColor: 'rgba(136, 143, 240, 0.4)',
  shadowColor: '#3b8eecff',
  shadowOpacity: 0.75,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
},

toggleText: {
  fontSize: hp(1.8),
  color: theme.colors.textDark,
},

toggleTextActive: {
  color: 'white',
  fontWeight: theme.fonts.semibold,
},
});