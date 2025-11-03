import { BrowserRouter, Routes, Route } from "react-router-dom";
import GetMyFavWebPage from "./pages/MyFavWeb";
import Index from "./pages/Index";
import GetNumOpPage from "./pages/NumOp";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import ForumIndexPage from "./pages/ForumIndex";
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

        <Route path="/talk" element={<ForumIndexPage/>}/>
      </Routes>
    </BrowserRouter>
  );
}


export default App