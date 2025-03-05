import { DefaultEventsMap, Socket } from "socket.io";

const chatsEvents = (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  socket.on("message:send", async (messageData) => {
    console.log("Message Received: ", messageData);

    // const savedMessage = await messageService.saveMessage(messageData);
    // socket.broadcast.emit("message:received", savedMessage);
  });

  socket.on("typing", (userData) => {
    socket.broadcast.emit("user:typing", userData);
  });
};

export default chatsEvents;
