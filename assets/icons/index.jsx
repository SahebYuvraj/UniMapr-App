import { StyleSheet } from 'react-native';
import theme from '../../constants/theme';
import ArrowLeft from './arrow';
import Call from './call';
import Camera from './camera';
import Comment from './comment';
import Delete from './delete';
import Edit from './edit';
import Heart from './heart';
import Home from './home';
import Image from './Image';
import Location from './location';
import Lock from './lock';
import Logout from './logout';
import Mail from './mail';
import Plus from './plus';
import Search from './search';
import Send from './send';
import Share from './share';
import ThreeDotsCircle from './threedotscircle';
import ThreeDotsHorizontal from './threedotshorizontal';
import User from './user';
import Video from './video';


const icons = {
    home: Home,
    mail:Mail,
    lock:Lock,
    user:User,
    heart:Heart,
    plus:Plus,
    search:Search,
    location:Location,
    call:Call,
    camera:Camera,
    edit:Edit,
    arrowLeft :ArrowLeft,
    threeDotsCircle:ThreeDotsCircle,
    threeDotsHorizontal:ThreeDotsHorizontal,
    comment:Comment,
    share:Share,
    send:Send,
    delete:Delete,
    logout:Logout,
    image:Image,
    video:Video,
    
    
   
   
    
    


}

const Icon = ({name, ...props}) => {
    const IconComponent = icons[name];
  return (
    <IconComponent
         height={props.size || 24}
         width={props.size || 24}
         strokeWidth={props.strokeWidth || 1.9}
         color={theme.colors.textLight}
        {...props}
    />


  )
}

export default Icon

const styles = StyleSheet.create({})