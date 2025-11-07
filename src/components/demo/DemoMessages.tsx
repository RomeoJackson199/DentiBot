import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send } from "lucide-react";

export function DemoMessages() {
  const conversations = [
    {
      patient: "Sarah Johnson",
      preview: "Thank you for the appointment reminder!",
      time: "10 min ago",
      unread: true,
      avatar: "SJ",
    },
    {
      patient: "John Smith",
      preview: "Can I reschedule my appointment?",
      time: "1 hour ago",
      unread: true,
      avatar: "JS",
    },
    {
      patient: "Mike Davis",
      preview: "Thanks for the cleaning today!",
      time: "2 hours ago",
      unread: false,
      avatar: "MD",
    },
    {
      patient: "Emma Wilson",
      preview: "Do I need to bring anything?",
      time: "Yesterday",
      unread: false,
      avatar: "EW",
    },
  ];

  return (
    <div className="p-6 space-y-6" data-tour="messages-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patient Messages</h1>
          <p className="text-muted-foreground mt-1">Communicate securely with your patients</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
          <MessageSquare className="mr-2 h-4 w-4" />
          New Message
        </Button>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Conversation List */}
          <div className="md:col-span-1 space-y-2">
            <h3 className="font-semibold mb-4">Conversations</h3>
            {conversations.map((conv, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  conv.unread
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'bg-muted/30 hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                    {conv.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm flex items-center justify-between">
                      <span>{conv.patient}</span>
                      {conv.unread && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {conv.preview}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground">{conv.time}</div>
              </div>
            ))}
          </div>

          {/* Message Thread */}
          <div className="md:col-span-2">
            <div className="bg-muted/30 rounded-lg p-4 h-full flex flex-col">
              <div className="flex items-center gap-3 pb-4 border-b mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  SJ
                </div>
                <div>
                  <div className="font-semibold">Sarah Johnson</div>
                  <div className="text-xs text-muted-foreground">Active 10 min ago</div>
                </div>
              </div>

              <div className="flex-1 space-y-4 mb-4">
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-lg max-w-[80%] shadow-sm">
                    <p className="text-sm">
                      Hi! I received the reminder for my appointment tomorrow at 10 AM. Thank you!
                    </p>
                    <div className="text-[10px] text-muted-foreground mt-1">10:25 AM</div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white p-4 rounded-lg max-w-[80%] shadow-sm">
                    <p className="text-sm">
                      Great! Looking forward to seeing you tomorrow. Please arrive 10 minutes
                      early.
                    </p>
                    <div className="text-[10px] text-blue-100 mt-1">10:26 AM</div>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-lg max-w-[80%] shadow-sm">
                    <p className="text-sm">Will do! Thanks!</p>
                    <div className="text-[10px] text-muted-foreground mt-1">10:27 AM</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled
                  />
                  <Button size="sm" className="bg-blue-600" disabled>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
