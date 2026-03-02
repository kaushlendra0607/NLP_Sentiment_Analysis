"""
Analyze the sentiment of the following text as much accurately and emotionally you can.

Tasks:
1. Identify the overall sentiment and also other minor emotions if present.
2. Identify mixed emotions within the statement.
3. Extract specific keywords driving those emotions and assign a confidence score (0.0 to 1.0).
4. Flag if sarcasm or irony is present.
Text to analyze: "{text}"

Respond STRICTLY in JSON format matching this schema:
{{
    "overall_sentiment": "Concern/Appreciation",
    "minor_emotions":["Anger","Complaints"],
    "emotion_breakdown":[
        {{"keyword": "slow/unhygienic", "emotion": "emotion_name", "confidence_score": 0.95}}
    ],
    "tone":"Positive/Negative/Neutral/Mixed",
    "sarcasm_flag": true/false
}}
overall_sentiment: this should the most dominant or major emotion of whole text,
concern and appreciation are just examples by me u can use other words which suite the emotion respectively
minor_emotions: these should be emotions other than overall_sentiment of the text,
give max five minor emotions or less, anger and complaints are just examples by me
emotional-breakdown: this is an array of given structure,
slow and hygienic are just some examples by me,
the keyword will be best words(usually adjectives) driving the emotion fo text,
no word should be given twice or more, choose the best words not any random word and give max 5 word for text smaller than 100 words,
max 10 word for text less than 500 words and max 20 for text more than 1000 words
you can give less or more number of words dpending on size but only the dominant keywords not any word
tone: it should describe overall tone i.e. +ve or -ve or neutral or mixed
and sarcasm_flag if sarcasm or irony is present
"""

def get_research_prompt(text: str) -> str:
    return f"""
Analyze the sentiment of the following text as accurately and emotionally as you can.

Task:
1. Identify the overall sentiment and also other minor emotions if present.
2. Identify mixed emotions within the statement.
3. Extract specific keywords driving those emotions and assign a confidence score (0.0 to 1.0).
4. Flag if sarcasm or irony is present.
Rules & Constraints:
1. overall_sentiment: Identify the single most dominant emotion of the text (e.g., "Concern", "Appreciation", "Anger", etc.).
2. minor_emotions: Provide an array of up to 5 (or less) secondary emotions present in the text.
3. emotion_breakdown: Extract the best specific keywords (usually adjectives, or the words you think are driving emotions) driving these emotions. 
    - NO DUPLICATE WORDS.
    - Select dominant keywords not random words.
    - Max 5 words for text < 100 words.
    - Max 10 words for text < 500 words.
    - Max 20 words for text > 1000 words.
4. tone: Describe the overall classification as strictly "Positive", "Negative", "Neutral", or "Mixed".
5. sarcasm_flag: Set to true if sarcasm or irony is present, otherwise false.

Text to analyze: "{text}"

Respond STRICTLY with valid JSON matching this exact schema:
{{
    "overall_sentiment": "String (Dominant Emotion)",
    "minor_emotions": ["String", "String"],
    "emotion_breakdown": [
        {{"keyword": "String", "emotion": "String", "confidence_score": 0.95}}
    ],
    "tone": "Positive/Negative/Neutral/Mixed",
    "sarcasm_flag": true/false
}}
"""