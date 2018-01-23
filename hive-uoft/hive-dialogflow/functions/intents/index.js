const intents = {
  PERMISSION: "request_permissions",
  ZERO: "before_welcome",
  WELCOME: "input.welcome",
  CLOSE: "say_bye",
  UNKNOWN: "input.unknown",
  USER: {
    INIT: "init_user",
    NEWS: "get_news",
    TIMEZONE: "get_timezone",
    WEATHER: "get_weather",
  },
  HIVE: {
    LIST: "list_hive",
    ACCESS: "access_hive",
    CREATE: "create_hive",
    LOCATION: "get_location",
    SWITCH: "switch_hive",
    CURRENT: "current_hive",
    DELETE: "delete_hive",
  },
  CONTACT: {
    CALL: "call_contact",
    ADD: "add_contact",
    DELETE: "delete_contact",
  },
};

module.exports = intents;
