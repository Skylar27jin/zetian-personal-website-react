import { BrowserRouter, Routes, Route } from "react-router-dom";
import GetMyFavWebPage from "./pages/MyFavWeb";
import Index from "./pages/Index";
import GetNumOpPage from "./pages/NumOp";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import UserForumIndex from "./pages/UserForumIndex";
import CreatePostPage from "./pages/CreatePostPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        //test route
        <Route path="/numop" element={<GetNumOpPage/>} />
        //my personal introduction
        <Route path="" element={<Index />} />

        //person's favorite website
        <Route path="/weblist" element={<GetMyFavWebPage />} />


        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/signup" element={<SignupPage/>}/>

        <Route path="/me" element={<UserForumIndex/>}/>
        <Route path="/post/create" element={<CreatePostPage />} />
      </Routes>
    </BrowserRouter>
  );
}


export default App