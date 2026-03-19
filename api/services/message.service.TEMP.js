// Patch pour le broadcast - injecter ce code dans le conteneur
// Dans handleMessage, remplacer les lignes de broadcast pour delete et edit:

// Pour delete:
if (deletedMessage) {
  console.log(`🗑️ Message supprimé: ${msg.messageId}`);
  await broadcastToChannel(
    {
      type: "message_deleted", // <-- CHANGÉ de 'delete' à 'message_deleted'
      messageId: msg.messageId,
    },
    serverId,
    channelId,
  );
  console.log(`✅ Broadcast suppression envoyé`);
}

// Pour edit:
if (updatedMessage) {
  console.log(
    `✏️ Message édité: ${msg.messageId}, nouveau contenu: "${msg.newContent}"`,
  );
  await broadcastToChannel(
    {
      type: "message_edited", // <-- CHANGÉ de 'edit' à 'message_edited'
      _id: updatedMessage._id.toString(),
      content: updatedMessage.content,
      edited: true,
    },
    serverId,
    channelId,
  );
  console.log(`✅ Broadcast édition envoyé`);
}
