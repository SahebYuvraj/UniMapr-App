import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View, } from 'react-native';
import Icon from '../../assets/icons';
import Button from '../../components/Button';
import Header from '../../components/Header';
import Input from '../../components/Input';
import ScreenWrapper from '../../components/ScreenWrapper';
import { hp, wp } from '../../constants';
import theme from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { getUserImageSrc, uploadImage } from '../../services/imageService';
import { updateUser } from '../../services/userService';





const EditProfile = () => {
  const {user: currentUser , setUserData } = useAuth();
//   console.log('User object:', currentUser);

    const [loading, setLoading] = useState(false);
    const router = useRouter();

  const[user, setUser] = useState ({
    name:'',
    phoneNumber:'', 
    image: null,
    bio:'',
    address:'',
    icalLink:''
  });

  useEffect(() => {
    if(currentUser){
        setUser({
            name: currentUser.name || '',
            phoneNumber: currentUser.phoneNumber || '',
            image: currentUser.image || null,
            address: currentUser.address || '',
            bio: currentUser.bio || '',
            icalLink: currentUser.icalLink || '',
        });
   }
  },[currentUser])

  const onPickImage = async () => {
    
    let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            aspect: [4,3],
            quality: 1,
        });

        if (!result.canceled) {
            setUser({...user,image:result.assets[0]});
        }    
    
  } 

    const onSubmit = async () => {
        let userData = {...user};
        let {name,phoneNumber,address,bio,image} = userData;
        
        // perform validation
        if(!name || !phoneNumber || !address || !bio || !image) {
            Alert.alert("Please fill all the fields!");
            return;
        }
        setLoading(true);

        if(typeof image == 'object') {
            let imageRes = await uploadImage('profiles', image?.uri, true);
            if(imageRes.success) userData.image = imageRes.data;
            else  userData.image = null;
        }
        const res = await updateUser(currentUser?.id, userData);
        setLoading(false);
        // console.log('Update user response:', res);

        if(res.success) {
            setUserData({...currentUser, ...userData});
            router.back();
        }
        

    }

  let imageSource = user.image && typeof user.image == 'object' 
  ? { uri: user.image.uri }
  : getUserImageSrc(currentUser?.image);

  return (
    <ScreenWrapper bg = "white">
      <View style={styles.container}>
        <ScrollView style={{ flex: 1 }}>
          <Header title="Edit Profile" />

          {/* form */}
          <View style={styles.form}>
            <View style={styles.avatarContainer}>
              <Image source={imageSource} style={styles.avatar} />
              <Pressable style={styles.cameraIcon } onPress = {onPickImage}>
                <Icon name ="camera" size={20} strokeWidth = {2.5} />
              </Pressable>
            </View>
            {/* Add more form fields/components here */}
            <Text style={{fontSize:hp(1.5),color:theme.colors.text}}>
                Form fields go here
            </Text>
            <Input
                icon = {<Icon name="user" />}
                placeholder ='Enter your name'
                value={user.name}
                onChangeText = {value => setUser({...user, name:value})}

            />

            <Input
                icon = {<Icon name="call" />}
                placeholder ='Enter your phone number'
                value={user.phoneNumber}
                onChangeText = {value => setUser({...user, phoneNumber:value})}
                
            />

            <Input
                icon = {<Icon name="location" />}
                placeholder ='Enter your address'
                value={user.address}
                onChangeText = {value => setUser({...user, address:value})}
                
            />
            <Input
                // icon={<Icon name="calendar" />}
                placeholder="Enter your iCal link"
                value={user.icalLink}
                onChangeText={(value) => setUser({ ...user, icalLink: value })}
            />

            <Input
                placeholder ='Enter your bio'
                value={user.bio}
                multiline={true}
                containerStyle = {styles.bio}
                onChangeText = {value => setUser({...user, bio:value})}
                
            />

            <Button title="Update"
            loading={loading}
            onPress={onSubmit}
            />
            {/* <Button
            title="Test iCal Fetch"
            onPress={async () => {
                if (!user.icalLink) {
                console.log('No iCal link provided');
                return;
                }
                const events = await fetchICalEvents(user.icalLink);
                console.log('Fetched events:', events.length);
                
            }}
            /> */}


            
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  )
}

export default EditProfile

const styles = StyleSheet.create({
  form: {
    gap: 18,
    marginTop: 20,
  },
  input: {
    flexDirection: 'row',
    borderWidth: 0.4,
    borderColor: theme.colors.text,
    borderRadius: theme.radius.xxl,
    borderCurve: 'continuous',
    padding: 17,
    paddingHorizontal: 20,
    gap: 15,
  },
  bio: { 
    flexDirection: 'row',
    height: hp(9.5),
    alignItems: 'flex-start',
    paddingVertical: 10, // Add a value for paddingVertical
  },
  avatarContainer: {
    height: hp(14),
    width: hp(14),
    alignSelf: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: theme.radius.xxl * 1.8,
    borderCurve: 'continuous',
    borderWidth: 2, // Add a value for borderWidth
    borderColor: theme.colors.darkLight,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    padding: 8,
    borderRadius: 50,
    backgroundColor: 'white',
    shadowColor: theme.colors.textLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7,
  },
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
});