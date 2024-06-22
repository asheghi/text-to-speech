import * as mongoose from 'mongoose';

await mongoose.connect('mongodb://0.0.0.0:27017/lingopal');
const exampleSchema = new mongoose.Schema({
    "example": { type: String, required: true },
    "translation": { type: String, },
    "partOfSpeech": { type: String, },
    "tip": { type: String }
});
const relatedSchema = new mongoose.Schema({
    word: { type: String, required: true },
    translation: { type: String, required: true },
    tip: { type: String, required: true }
});

const imageSchema = new mongoose.Schema({
    filename: { type: String },
    alt: { type: String },
    website_name: { type: String },
    website_domain: { type: String },
    website_url: { type: String },
    width: { type: String },
    height: { type: String }
});

const definitionSchema = new mongoose.Schema(
    {
        word: { type: String, required: true },
        phonetic: { type: String, },
        category: { type: String, },
        translations: { type: [String], },
        partsOfSpeech: { type: [String], },
        meanings: { type: [String], },
        examples: { type: [exampleSchema], },
        synonyms: { type: [String], },
        antonyms: { type: [String], },
        related: { type: [relatedSchema] },
        hasAudio: { type: Boolean },
        images: { type: [imageSchema] },
    },
    {
        methods: {
            speak() {
                console.log(`${this.word}!`);
            },
        },
        // strict: false,
        // strictQuery: false,
    }
);

export type DefinitionType = mongoose.InferSchemaType<typeof definitionSchema>;
export const Definition = mongoose.model('Definition', definitionSchema);