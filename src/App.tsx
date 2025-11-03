import { BrowserRouter, Routes, Route } from "react-router-dom";
import GetMyFavWebPage from "./pages/MyFavWeb";
import Index from "./pages/Index";
import GetNumOpPage from "./pages/NumOp";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/signup";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/numop" element={<GetNumOpPage/>} />
        <Route path="" element={<Index />} />
        <Route path="/weblist" element={<GetMyFavWebPage />} />
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/signup" element={<SignupPage/>}/>
      </Routes>
    </BrowserRouter>
  );
}


export default App