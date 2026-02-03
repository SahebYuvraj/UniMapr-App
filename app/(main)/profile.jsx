import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useState } from 'react';

import Icon from '../../assets/icons';
import Avatar from '../../components/Avatar';
import EventCard from '../../components/EventCard';
import Header from '../../components/Header';
import Loading from '../../components/Loading';
import ScreenWrapper from '../../components/ScreenWrapper';
import { hp, wp } from '../../constants';
import theme from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { fetchInterestedEvents } from '../../services/postService';


var limit = 0;
const profile = () => {
     const{user,setAuth} = useAuth();
      const router = useRouter();
      // console.log('User object:', user);

      const [posts, setPosts] = useState([]);
      const [events, setEvents] = useState([]);
      const [hasMore, setHasMore] = useState(true);


      const onLogout = async () => {
            //setAuth(null);
            const {error} = await supabase.auth.signOut();
            if(error) {
                Alert.alert('Logout',"Error logging out" );
                
            }
        };

      // const getPosts = async () => {
      //         // fetch posts from the server
      //         if(!hasMore) return null;
      
      //         limit += 10;
      
      //         let res = await fetchPosts(limit, user?.id);
      //         if(res.success) {
      //             if(posts.length == res.data.length) setHasMore(false);
      //             setPosts(res.data);
      //         }
      //         else {
      //             Alert.alert("Error fetching posts:", res.msg);
      //         }
              
      //     }

      const getEvents = async () => {
         console.log("➡️ getEvents() CALLED");
         console.log("👤 Current user id:", user?.id);

      if (!hasMore) return null;

      limit += 10;

      

      let res = await fetchInterestedEvents(user?.id, limit);

      
        console.log("📥 Raw Supabase response:", JSON.stringify(res.data, null, 2));
      if (res.success) {
        if (events.length === res.data.length) setHasMore(false);
        setEvents(res.data);
      } else {
        Alert.alert("Error", res.msg);
      }
    };



      

     const handleLogout = async () => {
      Alert.alert("Confirm Logout","Are you sure you want to logout?",[{
        text:"Cancel",
        onPress:()=> console.log("Cancel Pressed"),
        style:"cancel"
      },
    {
      text:"Logout",
      onPress: onLogout,
      style:"destructive"
    }
    ])
     }
    
       
       
  return (
    <ScreenWrapper bg = "white">

      <FlatList 
        // data={posts}
        
        data={events}
        ListHeaderComponent={<UserHeader user={user} router={router} handleLogout={handleLogout} onPress={() => router.push('editProfile')}/>}
        ListHeaderComponentStyle={{marginBottom:30}}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listStyle}
        keyExtractor={(item) => item.id.toString()}
        renderItem ={({item}) => 
          
          // <PostCard item={item} currentUser={user} router={router}/>
          <EventCard item={item} currentUser={user} router={router}/>
        }
        onEndReached={() => {
          // getPosts();
          getEvents();
        }}
        onEndReachedThreshold={0}
        ListFooterComponent={hasMore?(
          <View style = {{ marginVertical: posts.length ==0? 200:30}}>
            <Loading/>
          </View>
        ):(
          <View style={{marginVertical: 30}}>
          <Text style={styles.noPosts}>No more posts</Text> 
          </View>
        )}
        />
      
       {/* <Button title = "logout" onPress={onLogout}/> */}
    </ScreenWrapper>
  )
}

const UserHeader = ({user,router,handleLogout}) => {
  return (
    <View style={{flex: 1, backgroundColor: 'white',paddingHorizontal:wp(4)}}>
          <View>
            <Header title="Profile" mb={30}/>
            <TouchableOpacity style={styles.logoutButton} onPress = {handleLogout}>
              <Icon name="logout" size={20} color={theme.colors.rose} />
            </TouchableOpacity>
          </View>
          <View style={styles.container}>
           <View style={{gap:15}}>
            <View style={styles.avatarContainer}>
            <Avatar 
                uri = {user?.image}
                size={hp(12)}
                rounded = {theme.radius.xxl*1.4}

                />
                <Pressable style={styles.editIcon} >
                  <Icon name="edit" strokeWidth ={2.5} size={20} onPress={() => router.push('editProfile')}/>
                </Pressable>
                </View>

                {/* username and address */}
                <View style={{alignItems:'center',gap:5}}>
                  <Text style={styles.userName}>{user && user.name}</Text>
                  <Text style={styles.infoText}>{user && user.address}</Text>

                </View>

                <View style={{gap:10}}>
                  <View style={styles.info}>
                    <Icon name="mail" size={20}color={theme.colors.textLight}/>
                    <Text style={styles.infoText}>
                      {user && user.email}
                    </Text>
                    </View>
                    {
                      user && user.phoneNumber && (
                        <View style={styles.info}>
                      <Icon name="call" size={20} color={theme.colors.textLight}/>
                        <Text style={styles.infoText}>
                          {user && user.phoneNumber}
                        </Text>
                    </View>
                      )
                    }

                    {
                      user && user.bio && (
                        <View style={styles.info}>
                        <Text style={styles.infoText}>
                          {user && user.bio}
                        </Text>
                        </View>
                      )
                    }
                  </View>

                </View>

           </View>
          </View>
      
    )
}

export default profile

const styles = StyleSheet.create({
   container: {
    flex: 1,
    
  },
  headerContainer: {
    marginHorizontal: wp(4),
    marginBottom: 20,
  },
  headerShape: {
    width: wp(100),
    height: hp(20),
  },
  avatarContainer: {
    height: hp(12),
    width: hp(12),
    alignSelf: 'center',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: -12,
    padding: 7,
    borderRadius: 50,
    backgroundColor: 'white',
    shadowColor: theme.colors.textLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 1, // Replace Y with a number, e.g., 1
  },
  userName: {
    fontSize: hp(3),
    fontWeight: '500',
    color: theme.colors.textDark,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: hp(1.6),
    fontWeight: '500',
    color: theme.colors.textLight,
  },
  logoutButton: {
    position: 'absolute',
    right: 0,
    padding: 5,
    borderRadius: theme.radius.sm,
    backgroundColor: '#fee2e2',
  },
  listStyle: {
    paddingHorizontal: wp(4),
    paddingBottom: 30,
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: 'center',
    color: theme.colors.text,
  },
});