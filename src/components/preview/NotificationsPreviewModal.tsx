import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X, Bell, CheckCircle, Archive, Mail, MessageSquare, Smartphone, Settings, CheckCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { useTranslation } from 'react-i18next';
interface NotificationsPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type NotificationType = "task" | "mention" | "system" | "achievement";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  avatar?: string;
  details?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "task",
    title: t('preview.newTaskAssigned'),
    message: "Sarah Chen assigned you to Q1 Revenue Analysis",
    time: "2 min ago",
    read: false,
    avatar: "SC",
    details: t('preview.priorityHighDueTomorrow')
  },
  {
    id: "2",
    type: "mention",
    title: t('preview.mentionedInComment'),
    message: "@you mentioned in Marketing Campaign Review",
    time: "15 min ago",
    read: false,
    avatar: "MR",
    details: "Marcus Rivera: Great work on the conversion metrics! @you can you look into the bounce rate data from the landing page?"
  },
  {
    id: "3",
    type: "achievement",
    title: t('preview.milestoneCompleted'),
    message: "Project Customer Portal reached 100% completion",
    time: "1 hour ago",
    read: false,
    details: t('preview.all47TasksCompleted')
  },
  {
    id: "4",
    type: "system",
    title: t('preview.systemUpdate'),
    message: "New features available in NovaHub v2.4",
    time: "2 hours ago",
    read: true,
    details: t('preview.enhancedReportingDashboardImproved')
  },
  {
    id: "5",
    type: "task",
    title: t('preview.taskDueSoon'),
    message: "Prepare Q1 presentation due in 3 hours",
    time: "3 hours ago",
    read: true,
    avatar: "You"
  },
  {
    id: "6",
    type: "mention",
    title: t('preview.taggedInDocument'),
    message: "Alex Kim tagged you in 'Product Roadmap 2024'",
    time: "5 hours ago",
    read: true,
    avatar: "AK"
  },
  {
    id: "7",
    type: "task",
    title: t('preview.taskCompleted'),
    message: "David Park completed API Integration Testing",
    time: "6 hours ago",
    read: true,
    avatar: "DP"
  },
  {
    id: "8",
    type: "system",
    title: t('preview.scheduledMaintenance'),
    message: "System maintenance planned for Sunday 2AM-4AM",
    time: "8 hours ago",
    read: true
  },
  {
    id: "9",
    type: "achievement",
    title: t('preview.teamAchievement'),
    message: t('preview.yourTeamCompleted50'),
    time: "1 day ago",
    read: true
  },
  {
    id: "10",
    type: "mention",
    title: t('preview.replyToYourComment'),
    message: t('preview.lisaZhangRepliedTo'),
    time: "1 day ago",
    read: true,
    avatar: "LZ"
  },
  {
    id: "11",
    type: "task",
    title: t('preview.taskReminder'),
    message: t('preview.weeklyTeamSyncMeeting'),
    time: "2 days ago",
    read: true
  },
  {
    id: "12",
    type: "system",
    title: t('preview.securityAlert'),
    message: t('preview.newLoginFromChrome'),
    time: "2 days ago",
    read: true
  },
];

const typeConfig: Record<NotificationType, { label: string; color: string; bgColor: string }> = {
  task: { label: t('preview.task'), color: "text-blue-600", bgColor: "bg-blue-100" },
  mention: { label: t('preview.mention'), color: "text-purple-600", bgColor: "bg-purple-100" },
  system: { label: t('preview.system'), color: "text-gray-600", bgColor: "bg-gray-100" },
  achievement: { label: t('preview.achievement'), color: "text-green-600", bgColor: "bg-green-100" },
};

export function NotificationsPreviewModal({ open, onOpenChange }: NotificationsPreviewModalProps) {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<NotificationType | "all">("all");
  const [selectedNotification, setSelectedNotification] = useState<Notification>(mockNotifications[0]);
  const [notifications, setNotifications] = useState(mockNotifications);

  // Preferences state
  const [preferences, setPreferences] = useState({
    task: { email: true, slack: true, app: true },
    mention: { email: true, slack: true, app: true },
    system: { email: false, slack: false, app: true },
    achievement: { email: true, slack: false, app: true },
  });

  const totalSlides = 5;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleClose = () => {
    setCurrentSlide(0);
    onOpenChange(false);
  };

  const filteredNotifications = selectedFilter === "all"
    ? notifications
    : notifications.filter(n => n.type === selectedFilter);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (selectedNotification.id === id) {
      setSelectedNotification(prev => ({ ...prev, read: true }));
    }
  };

  const handleArchive = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const updatePreference = (type: NotificationType, channel: 'email' | 'slack' | 'app', value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [type]: { ...prev[type], [channel]: value }
    }));
  };

  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        // Slide 0: Intro
        return (
          <div className="flex flex-col items-center justify-center py-12 px-8 text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Bell className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-gray-900">{t('preview.stayUpdatedInRealtime')}</h2>
              <p className="text-lg text-gray-600 max-w-md">{t('preview.neverMissImportantUpdates')}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 w-full max-w-md">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
                <div className="text-sm text-blue-700">{t('preview.unread')}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{notifications.length}</div>
                <div className="text-sm text-purple-700">{t('preview.totalToday')}</div>
              </div>
            </div>
          </div>
        );

      case 1:
        // Slide 1: All Notifications
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{t('preview.allNotifications')}</h3>
              <Badge variant="secondary" className="text-sm">
                {unreadCount} unread
              </Badge>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {notifications.slice(0, 12).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                    notification.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
                  }`}
                  onClick={() => {
                    setSelectedNotification(notification);
                    setCurrentSlide(3);
                  }}
                >
                  <div className="flex items-start gap-3">
                    {notification.avatar && (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {notification.avatar}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${typeConfig[notification.type].bgColor} ${typeConfig[notification.type].color} text-xs px-2 py-0.5`}>
                          {typeConfig[notification.type].label}
                        </Badge>
                        <span className="text-xs text-gray-500">{notification.time}</span>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-600 ml-auto"></div>
                        )}
                      </div>
                      <div className="font-semibold text-gray-900 text-sm mb-0.5">{notification.title}</div>
                      <div className="text-sm text-gray-600 truncate">{notification.message}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        // Slide 2: Filters
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{t('preview.filterNotifications')}</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedFilter === "all" ? "default" : "outline"}
                onClick={() => setSelectedFilter("all")}
                className="rounded-full"
              >
                All ({notifications.length})
              </Button>
              {(Object.keys(typeConfig) as NotificationType[]).map((type) => {
                const count = notifications.filter(n => n.type === type).length;
                return (
                  <Button
                    key={type}
                    variant={selectedFilter === type ? "default" : "outline"}
                    onClick={() => setSelectedFilter(type)}
                    className="rounded-full"
                  >
                    {typeConfig[type].label} ({count})
                  </Button>
                );
              })}
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-all ${
                      notification.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {notification.avatar && (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {notification.avatar}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${typeConfig[notification.type].bgColor} ${typeConfig[notification.type].color} text-xs px-2 py-0.5`}>
                            {typeConfig[notification.type].label}
                          </Badge>
                          <span className="text-xs text-gray-500">{notification.time}</span>
                        </div>
                        <div className="font-semibold text-gray-900 text-sm mb-0.5">{notification.title}</div>
                        <div className="text-sm text-gray-600">{notification.message}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">{t('preview.noNotificationsOfThis')}</div>
              )}
            </div>
          </div>
        );

      case 3:
        // Slide 3: Notification Detail
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{t('preview.notificationDetail')}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentSlide(1)}
              >{t('preview.backToList')}</Button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-4">
                {selectedNotification.avatar && (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                    {selectedNotification.avatar}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${typeConfig[selectedNotification.type].bgColor} ${typeConfig[selectedNotification.type].color} text-xs px-2 py-0.5`}>
                      {typeConfig[selectedNotification.type].label}
                    </Badge>
                    <span className="text-sm text-gray-500">{selectedNotification.time}</span>
                    {!selectedNotification.read && (
                      <Badge variant="default" className="bg-blue-600 text-xs">{t('preview.unread')}</Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-lg text-gray-900 mb-2">
                    {selectedNotification.title}
                  </h4>
                  <p className="text-gray-700 mb-3">{selectedNotification.message}</p>

                  {selectedNotification.details && (
                    <div className="bg-gray-50 p-4 rounded-lg mt-4">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {selectedNotification.details}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAsRead(selectedNotification.id)}
                  disabled={selectedNotification.read}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {selectedNotification.read ? 'Marked as read': t('preview.markAsRead')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleArchive(selectedNotification.id);
                    setCurrentSlide(1);
                  }}
                  className="flex items-center gap-2"
                >
                  <Archive className="w-4 h-4" />{t('preview.archive')}</Button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-semibold text-sm text-blue-900 mb-2">{t('preview.quickActions')}</h5>
              <div className="flex gap-2">
                {selectedNotification.type === "task" && (
                  <>
                    <Button size="sm" variant="default">{t('preview.viewTask')}</Button>
                    <Button size="sm" variant="outline">{t('preview.assignToSomeone')}</Button>
                  </>
                )}
                {selectedNotification.type === "mention" && (
                  <>
                    <Button size="sm" variant="default">{t('preview.reply')}</Button>
                    <Button size="sm" variant="outline">{t('preview.viewThread')}</Button>
                  </>
                )}
                {selectedNotification.type === "achievement" && (
                  <>
                    <Button size="sm" variant="default">{t('preview.viewDetails')}</Button>
                    <Button size="sm" variant="outline">{t('preview.share')}</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        // Slide 4: Preferences
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-gray-700" />
              <h3 className="text-xl font-semibold text-gray-900">{t('preview.notificationPreferences')}</h3>
            </div>

            <p className="text-sm text-gray-600">{t('preview.chooseWhereYouWant')}</p>

            <div className="space-y-6">
              {(Object.keys(typeConfig) as NotificationType[]).map((type) => (
                <div key={type} className="border border-gray-200 rounded-lg p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={`${typeConfig[type].bgColor} ${typeConfig[type].color} px-3 py-1`}>
                      {typeConfig[type].label}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {type === "task" && t('preview.taskAssignmentsDueDates')}
                      {type === "mention" && t('preview.whenSomeoneMentionsOr')}
                      {type === "system" && t('preview.systemUpdatesAndAnnouncements')}
                      {type === "achievement" && t('preview.milestonesAndTeamAchievements')}
                    </span>
                  </div>

                  <div className="space-y-3 pl-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <Label htmlFor={`${type}-email`} className="text-sm font-medium">{t('preview.emailNotifications')}</Label>
                      </div>
                      <Switch
                        id={`${type}-email`}
                        checked={preferences[type].email}
                        onCheckedChange={(checked) => updatePreference(type, 'email', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-gray-500" />
                        <Label htmlFor={`${type}-slack`} className="text-sm font-medium">{t('preview.slackNotifications')}</Label>
                      </div>
                      <Switch
                        id={`${type}-slack`}
                        checked={preferences[type].slack}
                        onCheckedChange={(checked) => updatePreference(type, 'slack', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-gray-500" />
                        <Label htmlFor={`${type}-app`} className="text-sm font-medium">{t('preview.inappNotifications')}</Label>
                      </div>
                      <Switch
                        id={`${type}-app`}
                        checked={preferences[type].app}
                        onCheckedChange={(checked) => updatePreference(type, 'app', checked)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600">{t('preview.changesAreSavedAutomatically')}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">{t('preview.notificationsCenter')}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {renderSlide()}
        </div>

        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />{t('preview.previous')}</Button>

          <div className="flex gap-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? "bg-blue-600 w-8"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            onClick={currentSlide === totalSlides - 1 ? () => onOpenChange(false) : handleNext}
            className="flex items-center gap-2"
          >
            {currentSlide === totalSlides - 1 ? (
              <>{t('preview.finalizar')}<CheckCircle2 className="w-4 h-4" />
              </>
            ) : (
              <>{t('preview.next')}<ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
