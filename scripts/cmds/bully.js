exports.config = {
    name: "bully",
    category: "automation",
    author: "Rimon + Modified by Asif"
};

const userResponses = {};
const activeBullying = {};

module.exports.onStart = async function ({ api, event, args }) {
    const botAdmins = [
        "61558166309783",
        "100027116303378",
        "61572589774495"
    ]; 

    if (!botAdmins.includes(event.senderID)) {
        return api.sendMessage("- আসিফ এর কাছ থেকে অনুমতি নে আগে..!👽", event.threadID);
    }

    if (args[0] && args[0].toLowerCase() === "off") {
        const mention = Object.keys(event.mentions)[0];
        if (!mention) return api.sendMessage("- কোন আবাল রে অফ করবি মেনশন দে..!😜", event.threadID);

        activeBullying[mention] = false;
        return api.sendMessage(`${event.mentions[mention]}  আবাল তরে আর বুল্লি করবো না . ✅`, event.threadID);
    }

    const mention = Object.keys(event.mentions)[0];
    if (!mention) return api.sendMessage("কারে bully করবি? Mention কর আগে!", event.threadID);

    activeBullying[mention] = true;

    api.getUserInfo(mention, async (err, userInfo) => {
        if (err) return api.sendMessage("User info আনতে পারলাম না ভাই।", event.threadID);

        const roastLines = [
            "তোর বুদ্ধি দিয়া Calculator এ Snake খেলাই যায়",
            "তুই এমন এক চরিত্র, যারে দেইখা ফিচার ফোন Smart হইতে চাইছে",
            "তোর চোখে চোখ রাখলে WiFi কানেকশন ছিঁড়ে যায়",
            "তুই এত গণ্ডগোল, Google Maps ও তোকে খুঁজে পায় না",
            "তুই যেখানেই যাস, সেখানে নেটওয়ার্ক 'No Service' দেখায়",
            "তোর IQ এত low, বাল্ব তো দূরে থাক—মোমবাতিও জ্বলে না",
            "তুই সেই টাইপের লোক, যারে mirror দেখে বলে '404 face not found'",
            "তুই কথা বললে Grammar Book আত্মহত্যা করে",
            "তুই এত ফেক, Photoshop ও তোরে edit করতে ভয় পায়",
            "তোর ফ্যাশন সেন্স দেইখা পুরান রুমালও কান্দে",
            "তুই exam দিলে calculator খুঁজে 'exit' বাটন চাপে",
            "তোর status দেইখা Facebook suggest করে: ‘ভাই account deactivate করে দে’",
            "তুই গল্প শুরু করলেই Netflix unsubscribe করে",
            "তুই এমন এক রত্ন, যারে দেইখা Titanic ডুবে নাই—নিজেই লাফ দিছে",
            "তুই বলার আগেই মানুষ mute মারে—এটাকেই বলে খাঁটি তারকা",
            "তোর কথা শুনলে Bluetooth আপনাআপনি disconnect হয়",
            "তোর screenshot নিতেই Instagram বলছে: 'Sorry, cringe content not allowed'",
            "তুই হাসলে মানুষ ডাকে: ভাই কেউ কি VPN আছে",
            "তোর swag এত underdeveloped, দেখলে 2G কান্না করে",
            "তোরে দেইখা বাচ্চারা ভয় পায় না, Google Classroom করে",
            "তুই এত ধীর, loading bar তোরে দেইখা motivation পায়",
            "তোর attitude এত cheap, যে দোকানেও বলে—ফ্রি দিলেও নেব না",
            "তোরে দেইখা Windows ও বলে: 'Not Responding'",
            "তোর জোক্স শুনে even Siri বলে: 'Bruh, I quit'",
            "তুই selfie দিলে ক্যামেরা বলে—'Storage Full, Try Again'",
            "তোরে friend request পাঠাইলে Facebook বলে: 'Are you sure'",
            "তুই এত useless, যে recycle bin থেকেও reject খাস",
            "তোরে দেইখা গুগলও সার্চ বন্ধ করে দেয়—‘No results found’",
            "তোর লজিক এমন, physics book গায়ে আগুন ধরায়",
            "তোর কথা শুনলে fan ও ঘুরা বন্ধ করে দেয়—শান্তিতে মরতে চায়",
            "তুই এত cheap version, যে চাইনিজ কপি দিয়া তোরে বানায় নাই",
            "তোরে দেইখা traffic signalও bug খায়—সবুজ, লাল একসাথে",
            "তোরে স্কুলে দেইখা Attendance register logout করে",
            "তুই এত boring, mosquito তোরে কামড়াইতে গিয়া depression খায়",
            "তোর dp দেইখা ফোন screen protect করতে চায়"
        ];

        const emojis = ["😎","😈","🤪","😂","👽","💀","🔥","😏","🤖","🙃"];

        api.sendMessage(`কি খবর ${event.mentions[mention]}? তৈরি থাক, roast incoming...`, event.threadID);

        if (!userResponses[mention]) userResponses[mention] = { index: 0 };

        const listener = (err, message) => {
            if (!activeBullying[mention]) return;

            if (message && message.senderID === mention && message.body) {
                const currentIndex = userResponses[mention].index;
                const roast = roastLines[currentIndex % roastLines.length];
                const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                api.sendMessage(`- ${roast}...! ${emoji}`, message.threadID, message.messageID);
                userResponses[mention].index++;
            }
        };

        if (!userResponses[mention].listenerAttached) {
            api.listenMqtt(listener);
            userResponses[mention].listenerAttached = true;
        }
    });
};
