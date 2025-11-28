import { BrowserRouter, Routes, Route } from "react-router-dom";
import GetMyFavWebPage from "./pages/MyFavWeb";
import Index from "./pages/Index";
import GetNumOpPage from "./pages/NumOp";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import CreatePostPage from "./pages/CreatePostPage";
import UserProfilePage from "./pages/UserForumProfilePage";
import MyForumProfilePage from "./pages/MyForumProfilePage";
import PostDetailPage from "./pages/PostDetailPage";
import GopherLoadingPage from "./pages/GopherLoadingPage";
import NotFoundPage from "./pages/NotFoundPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SchoolFeedPage from "./pages/SchoolFeedPage";
import AvatarSettingsPage from "./pages/Settings/AvatarSettingsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        //test route
        <Route path="/numop" element={<GetNumOpPage />} />
        //my personal introduction
        <Route path="" element={<Index />} />
        //person's favorite website
        <Route path="/weblist" element={<GetMyFavWebPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/me" element={<MyForumProfilePage />} />
        <Route path="/post/create" element={<CreatePostPage />} />
        <Route path="/user/:id" element={<UserProfilePage />} />
        <Route path="/post/:id" element={<PostDetailPage />} />
        <Route path="loading" element={<GopherLoadingPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="/school/:id?" element={<SchoolFeedPage />} />
        <Route path="settings/avatar" element={<AvatarSettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />

        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
