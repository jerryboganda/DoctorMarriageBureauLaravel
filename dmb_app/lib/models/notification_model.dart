class AppNotification {
  final String id;
  final String type;
  final String? title;
  final String? message;
  final String? image;
  final String? actionUrl;
  final int? senderId;
  final String? senderName;
  final bool isRead;
  final String createdAt;
  final Map<String, dynamic>? data;

  const AppNotification({
    required this.id,
    required this.type,
    this.title,
    this.message,
    this.image,
    this.actionUrl,
    this.senderId,
    this.senderName,
    this.isRead = false,
    required this.createdAt,
    this.data,
  });

  factory AppNotification.fromApi(Map<String, dynamic> json) {
    final notifData = json['data'] as Map<String, dynamic>? ?? {};
    return AppNotification(
      id: json['id']?.toString() ?? '',
      type: notifData['type'] ?? json['type'] ?? '',
      title: notifData['title'] ?? json['title'],
      message: notifData['message'] ?? notifData['body'] ?? json['message'],
      image: notifData['image'] ?? notifData['avatar'],
      actionUrl: notifData['action_url'] ?? notifData['url'],
      senderId: notifData['sender_id'] != null ? int.tryParse(notifData['sender_id'].toString()) : null,
      senderName: notifData['sender_name'],
      isRead: json['read_at'] != null,
      createdAt: json['created_at'] ?? '',
      data: notifData,
    );
  }
}
