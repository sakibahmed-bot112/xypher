module.exports.config = {
    name: "bully",
    category: "automation",
    author: "Rimon"
};

const userResponses = {};

module.exports.onStart = async function ({ api, event }) {
    const botAdmins = ['61576212342334']; // এখানে তোর UID দে

    if (!botAdmins.includes(event.senderID)) {
        return api.sendMessage("তুই কে রে? Permission ছাড়া চলবি না ভাই!", event.threadID);
    }

    const mention = Object.keys(event.mentions)[0];
    if (!mention) return api.sendMessage("কারে bully করবি? Mention কর আগে!", event.threadID);

    api.getUserInfo(mention, async (err, userInfo) => {
        if (err) {
            return api.sendMessage("User info আনতে পারলাম না ভাই।", event.threadID);
        }

        const gender = userInfo[mention].gender;
        const genderText = gender === 1 ? "মাইয়া" : gender === 2 ? "পোলা" : "অজানা জাতের";

        const msg = [
            "তোর বুদ্ধি দিয়া Calculator এ Snake খেলাই যায়!",
            "তুই এমন এক চরিত্র, যারে দেইখা ফিচার ফোন Smart হইতে চাইছে!",
            "তোর চোখে চোখ রাখলে WiFi কানেকশন ছিঁড়ে যায়!",
            "তুই এত গণ্ডগোল, Google Maps ও তোকে খুঁজে পায় না!",
            "তুই যেখানেই যাস, সেখানে নেটওয়ার্ক 'No Service' দেখায়!",
            "তোর IQ এত low, বাল্ব তো দূরে থাক—মোমবাতিও জ্বলে না!",
            "তুই সেই টাইপের লোক, যারে mirror দেখে বলে '404 face not found'",
            "তুই কথা বললে Grammar Book আত্মহত্যা করে!",
            "তুই এত ফেক, Photoshop ও তোরে edit করতে ভয় পায়!",
            "তোর ফ্যাশন সেন্স দেইখা পুরান রুমালও কান্দে!",
            "তুই exam দিলে calculator খুঁজে 'exit' বাটন চাপে!",
            "তোর status দেইখা Facebook suggest করে: ‘ভাই account deactivate করে দে!’",
            "তুই গল্প শুরু করলেই Netflix unsubscribe করে!",
            "তুই এমন এক রত্ন, যারে দেইখা Titanic ডুবে নাই—নিজেই লাফ দিছে!",
            "তুই বলার আগেই মানুষ mute মারে—এটাকেই বলে খাঁটি তারকা!",
            "তোর কথা শুনলে Bluetooth আপনাআপনি disconnect হয়!",
            "তোর screenshot নিতেই Instagram বলছে: 'Sorry, cringe content not allowed!'",
            "তুই হাসলে মানুষ ডাকে: ভাই কেউ কি VPN আছে?",
            "তোর swag এত underdeveloped, দেখলে 2G কান্না করে!",
            "তোরে দেইখা বাচ্চারা ভয় পায় না, Google Classroom করে!"
        ];

        api.sendMessage(`কি খবর ${event.mentions[mention]}? তৈরি থাক, roast incoming...`, event.threadID);

        if (!userResponses[mention]) {
            userResponses[mention] = { index: 0 };
        }

        const listener = (err, message) => {
            if (message && message.senderID === mention && message.body) {
                const currentIndex = userResponses[mention].index;
                api.sendMessage(msg[currentIndex % msg.length], message.threadID, message.messageID);
                userResponses[mention].index++;
            }
        };

        // Listener attach যেন বারবার না হয়
        if (!userResponses[mention].listenerAttached) {
            api.listenMqtt(listener);
            userResponses[mention].listenerAttached = true;
        }
    });
};
