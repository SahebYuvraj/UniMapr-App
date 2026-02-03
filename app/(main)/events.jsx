import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import Icon from '../../assets/icons'
import Avatar from '../../components/Avatar'
import EventCard from '../../components/EventCard'
import Loading from '../../components/Loading'
import PostCard from '../../components/PostCard'
import ScreenWrapper from '../../components/ScreenWrapper'
import { hp, wp } from '../../constants'
import theme from '../../constants/theme'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { fetchEvents, fetchPosts } from '../../services/postService'
import { getUserData } from '../../services/userService'



var limit = 0;
const events = () => {

    const router = useRouter();
    const { user } = useAuth();

    const [posts, setPosts] = useState([]);
    const [events, setEvents] = useState([]);
    const [feed, setFeed] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const handlePostEvent = async (payload) => {
      if(payload.eventType === 'INSERT' && payload?.new?.id){
        let newPost = {...payload.new};
        let res = await getUserData(newPost.userid);
        newPost.postLikes = [];
        newPost.comments = [{count :0}];
        newPost.user = res.success ? res.data : {};
        setPosts((prevPosts) => [newPost, ...prevPosts]);
        
    }
    if(payload.eventType === 'DELETE'&& payload?.old?.id){
      setPosts( prevPosts => {
        let updatedPosts = prevPosts.filter(post => post.id != payload.old.id);
        return updatedPosts;
      })

    }
    if(payload.eventType === 'UPDATE' && payload?.new?.id){
        setPosts( prevPosts => {
          let updatedPosts = prevPosts.map(post => {
            if(post.id == payload.new.id){
              return {...post, ...payload.new};
            }
            return post;
          });
          return updatedPosts;
        });
        
    }
  }

  const loadEvents = async () => {
  const res = await fetchEvents(10);
  if (!res.success) return;

  const processed = res.data.map(e => ({
    ...e,
    type: "event",
    id:e.id || e.eventid
  }));
  console.log("EVENT RES", res);

  setEvents(processed);
};



    useEffect(() => {
        let postChannel = supabase
            .channel('posts')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'posts' },handlePostEvent)
            .subscribe();

        getPosts();
        loadEvents();
        


        return () => {
            supabase.removeChannel(postChannel);

        }

    }, [])

    useEffect(() => {
      const merged = [
        ...posts.map(p => ({ ...p, type: "post", createdAt: p.created_at })),
        ...events,
      ];

      merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      // need this in descending order

      setFeed(merged);
    }, [posts, events]);



    const getPosts = async () => {
        // fetch posts from the server
        if(!hasMore) return null;

        limit += 10;

        let res = await fetchPosts(limit);
        if(res.success) {
            if(posts.length == res.data.length) setHasMore(false);
            setPosts(res.data);
        }
        else {
            Alert.alert("Error fetching posts:", res.msg);
        }
        
    }
    // const filteredPosts = posts.filter(post =>
    //   post.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    //   post.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    // );

    // search filter for both posts and events
    const filteredFeed = feed.filter(item => {
    const q = searchQuery.toLowerCase();

    if (item.type === "post") {
      return (
        item.body?.toLowerCase().includes(q) ||
        item.user?.name?.toLowerCase().includes(q)
      );
    }

    if (item.type === "event") {
      return (
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      );
    }

    return false;
  });




  return (
    <ScreenWrapper>
        <View style = {styles.container}>
        <View style={styles.header}>
        <Text style={styles.title}>UNIMAPR</Text>
        <View style={styles.icons}>
            <Pressable onPress={()=>router.push('notifications')} >
                <Icon name="heart" size={hp(3.2)} strokeWidth={2} color={theme.colors.text} />
            </Pressable>
            <Pressable onPress={()=>router.push('newPost')}>
                <Icon name="plus" size={hp(3.2)} strokeWidth={2} color={theme.colors.text} />
            </Pressable>
            <Pressable onPress={()=>router.push('profile')}>
                <Avatar 
                    uri = {user?.image}
                    size={hp(4.3)}
                    rounded = {theme.radius.sm}
                    style={{borderWidth:2}}

                />
            </Pressable>
        </View>

        </View>

         {/* ADD SEARCH BAR HERE */}
          <View style={{ marginHorizontal: wp(4), marginBottom: 12 }}>
            <View style={{
              backgroundColor: theme.colors.gray,
              borderRadius: theme.radius.lg,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}>
              <TextInput
                placeholder="Search events..."
                placeholderTextColor={theme.colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ color: theme.colors.text }}
              />
            </View>
          </View>

          {/* posts list */}
          <FlatList
            // data={filteredPosts}
            data={filteredFeed}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listStyle}
            // keyExtractor={(item) => item.id.toString()}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            // renderItem={({ item }) => <PostCard item={item} currentUser={user} router={router}/>
            renderItem={({ item }) =>
                  item.type === "event" ? (
                    <EventCard item={item} currentUser={user} router={router} />
                  ) : (
                    <PostCard item={item} currentUser={user} router={router} />
                  )
            }

            onEndReached={() =>{
              getPosts();
            }}
            onEndReachedThreshold={0}

            ListFooterComponent={ hasMore?  (
            <View style={{marginVertical: posts.length==0? 200: 30}}>
              <Loading/>
            </View>):(
              <View style={{marginVertical: 30}}>
                <Text style={styles.noPosts}>No more posts</Text>
              </View>
            )}
            
            />
            

        </View>
      
    </ScreenWrapper>
  )
}

export default events

const styles = StyleSheet.create({
    container: { 
        flex: 1,
    },
    header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginHorizontal: wp(4),
    } ,
    title: {
    color: theme.colors.text,
    fontSize: hp(3.1),
    fontWeight: theme.fonts.bold,
    },
    avatarImage: {
    height: hp(4.3),
    width: hp(4.3),
    borderRadius: theme.radius.sm,
    borderCurve: 'continuous',
    borderColor: theme.colors.gray,
    borderWidth: 3,
    },
    icons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8, // You can adjust the gap value as needed
    },
    listStyle: {
        paddingTop: 20,
        paddingHorizontal: wp(4),
    },
    noPosts: {
    fontSize: hp(2),
    textAlign: 'center',
    color: theme.colors.text,
  },
  pill: {
    position: 'absolute',
    right: -10,
    top: -4,
    height: hp(2.2),
    width: hp(2.2),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: theme.colors.roseLight,
  },
  pillText: {
    color: 'white',
    fontSize: hp(1.2),
    fontWeight: theme.fonts.bold,
  },
});