// api/model/clearmessagecollection.js
const { mongoose, connectDB } = require("./config/dbmongo.js");
const Message = require("./model/message.js"); // ← Chemin correct

async function clearMessagesKeepLast2() {
  try {
    // Connexion MongoDB (même config que votre backend)

    //console.log('✅ Connecté MongoDB');
    await connectDB();
    // Récupérer les 2 derniers messages
    const last2Messages = await Message.find({
      channelId: "general",
      deleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(2);

    console.log(`📜 Garde ${last2Messages.length} derniers messages:`);
    last2Messages.forEach((msg) => {
      console.log(`  💬 #${msg.userId}: ${msg.content}`);
    });

    // Supprimer TOUS les autres
    const result = await Message.deleteMany({
      _id: {
        $nin: last2Messages.map((m) => m._id),
      },
    });

    console.log(`🗑️ SUPPRIMÉ ${result.deletedCount} messages`);
    console.log("✅ Collection messages nettoyée - 2 derniers gardés !");
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearMessagesKeepLast2();
