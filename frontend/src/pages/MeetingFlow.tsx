/**
 * This is the entrypage where users will first arrive from the external application.
 * - roomId is the room which the user wants to access
 * The entry page will just redirect the user and not display anything other than a splash screen
 * - if meetingroom is public then redirect to lobby with or without valid code
 * - if meetingroom is private then redirect to lobby if valid code otherwise to signup page
 */

import { useParams } from "react-router-dom";
import { meetingState } from "../modules/meeting/state/meeting";
import EntryPage from "./EntryPage";
import Lobby from "./Lobby";
import MeetingRoom from "./MeetingRoom";

interface RouteParams {
  meetingId: string;
}

interface RouteParams {
  meetingId: string;
}

export const MeetingFlowPage = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const { inLoadingPage, inLobbyPage } = meetingState();

  console.log("order", inLoadingPage, inLobbyPage);
  return inLoadingPage ? (
    <EntryPage />
  ) : inLobbyPage ? (
    <Lobby />
  ) : (
    <MeetingRoom />
  );
};
