import { BrowserRouter, Route, Routes } from "react-router-dom";
import CreateAccountPage from "./CreateAccountPage";
import LandingPage from "./LandingPage";
import { MeetingFlowPage } from "./MeetingFlow";

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/meeting/:meetingId" element={<MeetingFlowPage />} />
        <Route path="/create" element={<CreateAccountPage />} />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
};
export default AppRoutes;