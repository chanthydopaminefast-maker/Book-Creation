
export enum AppMode {
  DASHBOARD = 'dashboard',
  BOOK_CREATOR = 'book_creator',
  LOW_PICTURE_BOOK = 'low_picture_book',
  PROFESSIONAL_STUDIO = 'professional_studio',
  COLORING_LAB = 'coloring_lab',
  HIDDEN_OBJECTS = 'hidden_objects',
  WIMPY_DIARY = 'wimpy_diary'
}

export enum StoryGenre {
  FANTASY = 'Fantasy',
  SCIENCE_FICTION = 'Science Fiction',
  MORAL = 'Moral',
  MYSTERY = 'Mystery',
  THRILLER = 'Thriller',
  ADVENTURE = 'Adventure',
  EDUCATIONAL = 'Educational',
  JOURNAL = 'Diary/Journal Style',
  FUNNY = 'Funny',
  COMEDY = 'Comedy',
  BEDTIME = 'Bedtime Story',
  PERSONAL_DEVELOPMENT = 'Personal Development',
  PERSONAL_GROWTH = 'Personal Growth',
  MIND_AND_BODY = 'Mind and Body',
  HEALTH_WELLNESS = 'Health & Wellness',
  SPIRITUALITY = 'Spirituality',
  HISTORY = 'History',
  BIOGRAPHY = 'Biography',
  POETRY = 'Poetry',
  DRAMA = 'Drama',
  HORROR = 'Horror',
  ROMANCE = 'Romance',
  KIDS_STORY = 'Kids Story',
  BUDDHISM = 'Buddhism',
  DHARMA = 'Dharma',
  PHILOSOPHY = 'Philosophy',
  MANAGEMENT = 'Management/Leadership',
  MYTHOLOGY = 'Mythology',
  COOKBOOK = 'Cookbook/Recipes',
  BUSINESS = 'Business/Finance',
  TRUE_CRIME = 'True Crime',
  TRAVEL = 'Travel/Guides'
}

export enum WorksheetLayout {
  FULL_PAGE = 'full_page',
  HALF_SHEET_CUT = 'half_sheet_cut',
  TRI_FOLD = 'tri_fold'
}

export enum AgeGroup {
  PICTURE_BOOK = '0-5 Years (Picture Book)',
  EARLY_READERS = '6-8 Years (Early Readers)',
  MIDDLE_GRADE = '9-12 Years (Middle Grade)',
  TEENS = '13-18 Years (Teens)',
  ADULTS = '18+ Years (Adults)',
  MATURE = 'Mature (Explicit Content)'
}

export enum LanguageTone {
  WRITTEN = 'Formal/Written',
  SPOKEN = 'Informal/Spoken'
}

export enum PaperStyle {
  LINED = 'lined',
  GRID = 'grid',
  DOTTED = 'dotted',
  PLAIN = 'plain',
  DIARY = 'diary'
}

export enum PaperSize {
  A3 = 'A3',
  A4 = 'A4',
  A5 = 'A5',
  A6 = 'A6'
}

export enum ImagePosition {
  LEFT = 'left',
  RIGHT = 'right',
  TOP = 'top',
  BOTTOM = 'bottom',
  RANDOM = 'random',
  NONE = 'none'
}

export enum Language {
  ENGLISH = 'English',
  KHMER = 'Khmer',
  SPANISH = 'Spanish',
  FRENCH = 'French',
  GERMAN = 'German',
  HINDI = 'Hindi',
  DUTCH = 'Dutch',
  CHINESE = 'Chinese',
  KOREAN = 'Korean',
  JAPANESE = 'Japanese',
  THAI = 'Thai'
}

export enum BookFont {
  HANDWRITTEN = 'font-handwritten',
  PATRICK = 'font-patrick',
  COMING_SOON = 'font-coming-soon',
  MARKER = 'font-marker',
  CLASSIC = 'font-playfair',
  SANS = 'font-inter',
  SERIF = 'font-serif',
  SCHOOL = 'font-school',
  GOCHI = 'font-gochi',
  KHMER = 'font-khmer',
  KHMER_HAND = 'font-khmer-hand',
  TRACING = 'font-tracing'
}

export interface VocabularyItem {
  word: string;
  definition: string;
}

export interface BookPage {
  pageNumber: number;
  title?: string;
  text: string;
  imagePrompt: string;
  imageUrl?: string;
  audioData?: string; 
  layout: 'left' | 'right' | 'top' | 'bottom' | 'none';
  vocabulary?: VocabularyItem[];
}

export interface Book {
  id: string;
  timestamp: number;
  title: string;
  author: string;
  genre: StoryGenre;
  ageGroup: AgeGroup;
  level: number;
  language: Language;
  languageTone: LanguageTone;
  pages: BookPage[];
  coverImageUrl?: string;
  font: BookFont;
  paperStyle: PaperStyle;
  paperSize: PaperSize;
  lineSpacing: number;
  fontSize: number;
  hasVoiceover: boolean;
  highlightText: boolean;
  highlightColor?: string;
  heroAvatars?: string[];
  hasTableOfContents: boolean;
  tocStyle?: 'classic' | 'modern' | 'minimal' | 'playful';
  isLowIllustration?: boolean;
  isTextOnly?: boolean;
  vocabularyEnabled?: boolean;
  pageSpacingMode: 'fixed' | 'fit';
}

export interface TracingItem {
  id: string;
  text: string;
  repeatCount: number;
  fontStyle?: BookFont;
}

export interface ColoringCard {
  id: string;
  imageUrl: string;
  tracingItems: TracingItem[];
  paperSize: PaperSize;
  layout: WorksheetLayout;
  teacherName?: string;
  date?: string;
  parentSignature?: boolean;
  hasStars?: boolean;
  lineThickness: number;
  elementSpacing: number;
  tracingSpacing: number;
  frameStyle?: 'none' | 'bubbles' | 'stars' | 'leaves' | 'classic' | 'random';
}

export interface StoryGenerationResponse {
  title: string;
  pages: {
    pageNumber: number;
    title?: string;
    text: string;
    imagePrompt: string;
    vocabulary?: VocabularyItem[];
  }[];
}
