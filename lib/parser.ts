export interface ParsedMessage {
  date: Date;
  hour: number; // 0–23
  sender: string;
  message: string;
  monthYear: string; // "YYYY-MM"
}

function parseHour(timeStr: string): number {
  // iOS: "1:59:53 PM" or "13:59:53"
  // Android: "13:59" or "1:59 PM"
  const parts = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!parts) return 0;
  let hour = parseInt(parts[1], 10);
  const ampm = parts[3];
  if (ampm) {
    if (ampm.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
  }
  return hour;
}

export function parseWhatsAppChat(text: string): ParsedMessage[] {
  const lines = text.split(/\r?\n/);
  const messages: ParsedMessage[] = [];

  // iOS format:  [7/7/25, 1:59:53 PM] Aryan Shah: hello
  const iosRegex =
    /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)?)\]\s*([^:]+):\s*(.*)$/i;

  // Android format:  07/07/2025, 13:59 - Aryan Shah: hello
  const androidRegex =
    /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2})\s*-\s*([^:]+):\s*(.*)$/i;

  let currentMessage: ParsedMessage | null = null;

  for (const line of lines) {
    const match = line.match(iosRegex) || line.match(androidRegex);

    if (match) {
      if (currentMessage) {
        messages.push(currentMessage);
      }

      const [, dateStr, timeStr, sender, message] = match;
      const [month, day, year] = dateStr.split("/").map(Number);
      const fullYear = year < 100 ? 2000 + year : year;
      const date = new Date(fullYear, month - 1, day);

      currentMessage = {
        date,
        hour: parseHour(timeStr),
        sender: sender.trim(),
        message: message.trim(),
        monthYear: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      };
    } else if (currentMessage && line.trim().length > 0) {
      // Continuation of previous message
      currentMessage.message += "\n" + line.trim();
    }
  }

  if (currentMessage) {
    messages.push(currentMessage);
  }

  return messages;
}
