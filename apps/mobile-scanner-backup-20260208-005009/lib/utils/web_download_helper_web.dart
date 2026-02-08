import 'dart:convert';
import 'dart:typed_data';
import 'package:web/web.dart' as web;

void downloadFileWeb(Uint8List bytes, String fileName) {
  final base64Data = base64Encode(bytes);
  final url = 'data:application/octet-stream;base64,$base64Data';
  final anchor = web.document.createElement('a') as web.HTMLAnchorElement;
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
}
