import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type MoodCategory = {
    #happy;
    #sad;
    #energetic;
    #calm;
    #angry;
    #romantic;
    #focused;
  };

  module MoodCategory {
    public func compare(a : MoodCategory, b : MoodCategory) : Order.Order {
      switch (a, b) {
        case (#happy, #happy) { #equal };
        case (#happy, _) { #less };
        case (#sad, #happy) { #greater };
        case (#sad, #sad) { #equal };
        case (#sad, _) { #less };
        case (#energetic, #happy) { #greater };
        case (#energetic, #sad) { #greater };
        case (#energetic, #energetic) { #equal };
        case (#energetic, _) { #less };
        case (#calm, #angry) { #less };
        case (#calm, #romantic) { #less };
        case (#calm, #focused) { #less };
        case (#calm, #calm) { #equal };
        case (#angry, #angry) { #equal };
        case (#angry, _) { #greater };
        case (#romantic, #romantic) { #equal };
        case (#romantic, _) { #greater };
        case (#focused, #focused) { #equal };
      };
    };

    public func toText(mood : MoodCategory) : Text {
      switch (mood) {
        case (#happy) { "Happy" };
        case (#sad) { "Sad" };
        case (#energetic) { "Energetic" };
        case (#calm) { "Calm" };
        case (#angry) { "Angry" };
        case (#romantic) { "Romantic" };
        case (#focused) { "Focused" };
      };
    };
  };

  public type MoodEntry = {
    mood : MoodCategory;
    intensity : Nat8;
    timestamp : Time.Time;
  };

  module MoodEntry {
    public func compare(a : MoodEntry, b : MoodEntry) : Order.Order {
      Int.compare(a.timestamp, b.timestamp);
    };
  };

  public type Song = {
    title : Text;
    artist : Text;
    album : Text;
    mood : MoodCategory;
    url : Text;
    artwork : Text;
  };

  public type TypingPattern = {
    speed : Float;
    rhythm : Float;
    intensity : Float;
    timestamp : Time.Time;
  };

  public type UserPreferences = {
    preferredGenres : [Text];
    volumeLevel : Nat8;
    autoplay : Bool;
    theme : Text;
  };

  public type UserProfile = {
    name : Text;
    moodHistory : [MoodEntry];
    likedSongs : [Song];
    typingPatterns : [TypingPattern];
    preferences : UserPreferences;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let songCache = Map.empty<Text, Song>();

  public type MoodAnalysisResult = {
    dominantMood : MoodCategory;
    intensity : Nat8;
    trend : Text;
  };

  public query ({ caller }) func getMoodCategories() : async [MoodCategory] {
    [#happy, #sad, #energetic, #calm, #angry, #romantic, #focused];
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func saveMoodEntry(mood : MoodCategory, intensity : Nat8) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save mood entries");
    };

    let newEntry : MoodEntry = {
      mood;
      intensity;
      timestamp = Time.now();
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        let defaultPreferences : UserPreferences = {
          preferredGenres = [];
          volumeLevel = 50;
          autoplay = true;
          theme = "default";
        };
        let newProfile : UserProfile = {
          name = "Anonymous";
          moodHistory = [newEntry];
          likedSongs = [];
          typingPatterns = [];
          preferences = defaultPreferences;
        };
        userProfiles.add(caller, newProfile);
      };
      case (?profile) {
        let updatedHistory = [newEntry].concat(profile.moodHistory);
        let updatedProfile : UserProfile = {
          profile with
          moodHistory = updatedHistory;
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func saveTypingPattern(speed : Float, rhythm : Float, intensity : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save typing patterns");
    };

    let newPattern : TypingPattern = {
      speed;
      rhythm;
      intensity;
      timestamp = Time.now();
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        let defaultPreferences : UserPreferences = {
          preferredGenres = [];
          volumeLevel = 50;
          autoplay = true;
          theme = "default";
        };
        let newProfile : UserProfile = {
          name = "Anonymous";
          moodHistory = [];
          likedSongs = [];
          typingPatterns = [newPattern];
          preferences = defaultPreferences;
        };
        userProfiles.add(caller, newProfile);
      };
      case (?profile) {
        let updatedPatterns = [newPattern].concat(profile.typingPatterns);
        let updatedProfile : UserProfile = {
          profile with
          typingPatterns = updatedPatterns;
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func saveUserPreferences(preferences : UserPreferences) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update preferences");
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        let newProfile : UserProfile = {
          name = "Anonymous";
          moodHistory = [];
          likedSongs = [];
          typingPatterns = [];
          preferences;
        };
        userProfiles.add(caller, newProfile);
      };
      case (?profile) {
        let updatedProfile : UserProfile = {
          profile with
          preferences;
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func likeSong(song : Song) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can like songs");
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        let defaultPreferences : UserPreferences = {
          preferredGenres = [];
          volumeLevel = 50;
          autoplay = true;
          theme = "default";
        };
        let newProfile : UserProfile = {
          name = "Anonymous";
          moodHistory = [];
          likedSongs = [song];
          typingPatterns = [];
          preferences = defaultPreferences;
        };
        userProfiles.add(caller, newProfile);
      };
      case (?profile) {
        let updatedSongs = [song].concat(profile.likedSongs);
        let updatedProfile : UserProfile = {
          profile with
          likedSongs = updatedSongs;
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func cacheSong(song : Song) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can cache songs");
    };
    songCache.add(song.url, song);
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func fetchMusicAPI(url : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch music");
    };
    await OutCall.httpGetRequest(url, [], transform);
  };

  public query ({ caller }) func getSongCache() : async [Song] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view song cache");
    };
    songCache.values().toArray();
  };
};
