import { BrowserRouter, Routes, Route } from "react-router-dom";
import GetMyFavWebPage from "./pages/MyFavWeb";
import Index from "./pages/Index";
import GetNumOpPage from "./pages/NumOp";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/numop" element={<GetNumOpPage/>} />
        <Route path="" element={<Index />} />
        <Route path="/weblist" element={<GetMyFavWebPage />} />
      </Routes>
    </BrowserRouter>
  );
}


export default App