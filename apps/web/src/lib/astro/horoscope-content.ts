// Reading text for the daily horoscope, keyed by which house from a sign the
// transiting Moon occupies (traditional Chandra Gochar). Two variants per
// section so a page doesn't read identically every time the Moon returns to
// the same house. Written as guidance, never as a promise: no medical or
// financial claims.

export interface HouseReading {
  tone: "favourable" | "mixed" | "cautious";
  scores: { overall: number; love: number; career: number; health: number };
  general: [string, string];
  love: [string, string];
  career: [string, string];
  health: [string, string];
}

export const HOUSE_READINGS: Record<number, HouseReading> = {
  1: {
    tone: "favourable",
    scores: { overall: 4, love: 4, career: 4, health: 3 },
    general: [
      "The Moon transits your own sign today, turning attention inward and to yourself. Feelings run closer to the surface than usual, and people notice you more. It suits fresh starts, personal decisions and looking after your own needs.",
      "With the Moon in your sign, your energy and emotions are front and centre. You may feel more expressive, and small moods can colour the whole day. Use the momentum for something you have been putting off about yourself."
    ],
    love: [
      "Warmth comes easily and you are more magnetic than usual. Say what you actually feel; partners respond to honesty today.",
      "Emotions are strong, so avoid reading too much into passing remarks. A sincere, open conversation goes a long way."
    ],
    career: [
      "You are more visible at work, so present your ideas with confidence. A good day to take the first step on a new task.",
      "Initiative is rewarded, though it helps to listen before deciding. Lead with what you can personally deliver."
    ],
    health: [
      "Energy is good, but emotional swings can affect sleep. Keep a steady routine and drink enough water.",
      "A day to tune in to your body. Light exercise and a calm evening will keep you balanced."
    ]
  },
  2: {
    tone: "mixed",
    scores: { overall: 3, love: 3, career: 3, health: 3 },
    general: [
      "The Moon in your second house draws attention to money, food and family talk. Words carry extra weight today, so speak kindly and think before committing to anything financial.",
      "Family and resources are the themes today. It is a fair day for practical planning, but not for impulsive spending or sharp remarks."
    ],
    love: [
      "Gentle, sincere words strengthen bonds; sarcasm does the opposite. A meal or an evening with family brings comfort.",
      "Take care not to say more than you mean. Small acts of care matter more than big promises."
    ],
    career: [
      "Steady, routine work goes well. Double-check figures and wording in anything you send or sign.",
      "Be careful with negotiations and quotes; clarity now saves trouble later. Keep promises modest."
    ],
    health: [
      "Watch what you eat and avoid heavy or oily food late in the evening.",
      "Throat and digestion can be sensitive; warm, simple food and enough rest help."
    ]
  },
  3: {
    tone: "favourable",
    scores: { overall: 4, love: 3, career: 4, health: 4 },
    general: [
      "The Moon in your third house lifts courage and communication. It is a good day to write, call, negotiate or take a short trip, and to sort things out with siblings or neighbours.",
      "Initiative and effort pay off today. Reach out to people you have been meaning to contact and follow through on small tasks."
    ],
    love: [
      "Light, playful conversation brings you closer. A message or call from a friend or partner lifts your mood.",
      "Talk more than you brood. Shared plans, even small ones, help."
    ],
    career: [
      "Good for meetings, presentations and outreach. Your words land well, so speak up.",
      "Communication-heavy work flows; use the day to pitch, follow up or learn something practical."
    ],
    health: [
      "Energy is decent; a walk or short workout helps. Avoid overexerting your shoulders and arms.",
      "Stay active, but pace yourself. Restless energy is better spent moving than worrying."
    ]
  },
  4: {
    tone: "cautious",
    scores: { overall: 2, love: 3, career: 3, health: 3 },
    general: [
      "The Moon in your fourth house brings attention to home, family and peace of mind. You may feel more sentimental or restless than usual, so build in some quiet time.",
      "Comfort, property and family matters come up today. Emotions can feel heavy for no clear reason; a familiar routine steadies them."
    ],
    love: [
      "Home is where connection happens today. Time with your partner or family works better than going out.",
      "Feelings run deep and can turn moody. Be patient, and give each other some space if needed."
    ],
    career: [
      "Concentration may dip, so tackle routine work and leave big decisions for another day. Working from a calm spot helps.",
      "Not the day for risky moves; consolidate what is already in progress."
    ],
    health: [
      "Emotional tension can show up as tiredness or an unsettled stomach. Rest and a light meal help.",
      "Prioritise sleep and a calm environment. Avoid dwelling on worries late at night."
    ]
  },
  5: {
    tone: "mixed",
    scores: { overall: 3, love: 4, career: 3, health: 3 },
    general: [
      "The Moon in your fifth house favours creativity, study and matters of the heart. Ideas come easily, though it is wise to check enthusiasm against facts.",
      "A playful, inventive day. Children, hobbies and romance take centre stage; avoid speculating with money."
    ],
    love: [
      "Romance and affection are highlighted. A spontaneous plan or heartfelt message can brighten things.",
      "Feelings are warm but can be impulsive; enjoy them without rushing into promises."
    ],
    career: [
      "Creative and learning-related work does well. Brainstorm freely, then let the numbers decide.",
      "Good for study, planning and original ideas; less good for gambles or hasty commitments."
    ],
    health: [
      "Generally fine; keep an eye on stress-eating and late nights.",
      "Stay active and choose light food. Mental tiredness responds well to a break and fresh air."
    ]
  },
  6: {
    tone: "favourable",
    scores: { overall: 4, love: 3, career: 4, health: 4 },
    general: [
      "With the Moon in your sixth house, obstacles are easier to overcome and rivals lose their edge. It is a strong day for clearing pending work, routines and health habits.",
      "Practical effort pays off. Tackle the dull, necessary tasks; you have the stamina for them today."
    ],
    love: [
      "Show care through help and small acts of service. Avoid petty arguments; they fade quickly if you let them.",
      "Practical support means more than grand gestures today. Keep disagreements light."
    ],
    career: [
      "Excellent for finishing backlog, handling competition and solving problems. Steady work gets noticed.",
      "Details and follow-through are your strengths today; tackle the tricky item you have been avoiding."
    ],
    health: [
      "Good for starting or resuming a healthy routine. Digestion improves with simple food.",
      "Vitality is decent. A good day for a check-up you have postponed or a fresh diet habit."
    ]
  },
  7: {
    tone: "favourable",
    scores: { overall: 4, love: 4, career: 4, health: 3 },
    general: [
      "The Moon in your seventh house highlights partnerships, whether personal or professional. Meetings and joint decisions go well, and people are receptive to you.",
      "Cooperation is the theme today. Listen as much as you speak, and shared plans move forward smoothly."
    ],
    love: [
      "Excellent for quality time with your partner; if you are single, an introduction or warm conversation could go somewhere.",
      "Harmony is easier than usual. Express appreciation openly."
    ],
    career: [
      "A good day for negotiations, collaborations and client meetings. Compromise wins more than pushing.",
      "Team effort brings results. Be clear about roles and expectations."
    ],
    health: [
      "Stable. Balance work with rest and share meals with people you like.",
      "Keep hydration up and avoid skipping meals amid a busy schedule."
    ]
  },
  8: {
    tone: "cautious",
    scores: { overall: 2, love: 2, career: 2, health: 2 },
    general: [
      "The Moon in your eighth house is a sensitive position. Delays and hidden worries can surface, so slow down, avoid risks and keep important decisions for another day.",
      "A day for caution and reflection rather than bold moves. Emotions run deep; go easy on yourself and others."
    ],
    love: [
      "Misunderstandings are more likely; avoid bringing up old grievances. Patience and a gentle tone help.",
      "Feelings are intense and easily hurt. Give your partner space and avoid assumptions."
    ],
    career: [
      "Expect slower progress and unexpected checks. Review documents carefully and avoid signing anything in a hurry.",
      "Not ideal for new ventures or risky bets. Focus on maintaining what you already have."
    ],
    health: [
      "Take extra care with fatigue and sleep. Avoid risky activity and heavy meals.",
      "Be gentle with yourself; rest, hydration and calm routines matter more than usual."
    ]
  },
  9: {
    tone: "mixed",
    scores: { overall: 3, love: 3, career: 4, health: 3 },
    general: [
      "The Moon in your ninth house turns thoughts to purpose, learning and faith. Blessings from elders or mentors are possible, though small delays can test patience.",
      "Good for study, worship and long-term planning. Luck is present but works best with steady effort."
    ],
    love: [
      "Shared values and honest talk deepen bonds. A trip or outing together lifts the mood.",
      "Be open to advice from someone you trust; avoid preaching to your partner."
    ],
    career: [
      "Good for training, higher studies and guidance from seniors. Long-range plans progress.",
      "Keep the bigger picture in mind; a mentor's input can unlock a decision."
    ],
    health: [
      "Fairly steady. Gentle exercise, prayer or meditation supports calm.",
      "Guard against overwork; regular meals and rest keep energy level."
    ]
  },
  10: {
    tone: "favourable",
    scores: { overall: 4, love: 3, career: 5, health: 3 },
    general: [
      "The Moon in your tenth house puts your work and reputation in the spotlight. Effort is noticed, and authority figures are receptive.",
      "A strong day for responsibility and recognition. Take on the task that lets you show real skill."
    ],
    love: [
      "Work may take priority, so make a point of showing your partner you are thinking of them.",
      "Pride can get in the way; a small gesture of appreciation restores balance."
    ],
    career: [
      "One of the better days for career moves, promotions and important meetings. Be visible and dependable.",
      "Ambition is backed by good timing. Present your work and ask for what you deserve, politely."
    ],
    health: [
      "Busy schedules can drain you; take breaks and keep an eye on your posture.",
      "Energy is good but avoid overcommitting. Short breaks keep you effective."
    ]
  },
  11: {
    tone: "favourable",
    scores: { overall: 5, love: 4, career: 5, health: 4 },
    general: [
      "The Moon in your eleventh house is one of the most supportive placements. Gains, helpful friends and the fulfilment of small wishes are likely.",
      "Networks and goals get a boost. Reach out to friends and acquaintances; someone may open a door."
    ],
    love: [
      "Social occasions bring happy connections. Celebrate good news together.",
      "Friendship is the foundation of love today; warm gatherings and shared laughter help."
    ],
    career: [
      "Excellent for networking, targets and income-related work. Team support comes easily.",
      "A good day for sales, fundraising and widening your circle. Follow up on promising leads."
    ],
    health: [
      "Mood and energy are high. Keep healthy habits even when celebrating.",
      "Vitality is good; enjoy social time but keep an eye on indulgent food."
    ]
  },
  12: {
    tone: "cautious",
    scores: { overall: 2, love: 3, career: 2, health: 2 },
    general: [
      "The Moon in your twelfth house favours rest, reflection and quiet retreat. Expenses can creep up and energy may feel low, so slow the pace and simplify.",
      "A day to wind down rather than push. Spending, sleep and solitude are the themes; save big decisions for later."
    ],
    love: [
      "Give your partner quiet, undemanding company; do not force conversations. Compassion works better than debate.",
      "You may crave solitude. Say so gently so it isn't mistaken for distance."
    ],
    career: [
      "Work can feel behind the scenes and slower. Good for research, planning and tasks that do not need an audience.",
      "Avoid confrontations and unnecessary expenses. Steady, unnoticed effort is still progress."
    ],
    health: [
      "Sleep may be disturbed; a calm evening routine helps. Watch fatigue and eye strain.",
      "Rest is the best medicine today. Keep screens off before bed and stay hydrated."
    ]
  }
};

export const NAKSHATRA_THEMES: Record<string, string> = {
  "Ashwini": "quick starts, healing and fresh energy",
  "Bharani": "responsibility, endurance and hidden strength",
  "Krittika": "clarity, decisive action and honest speech",
  "Rohini": "beauty, comfort, growth and creativity",
  "Mrigashira": "curiosity, searching and gentle communication",
  "Ardra": "emotional release, honest reflection and change",
  "Punarvasu": "renewal, second chances and returning to basics",
  "Pushya": "nurturing, learning and steady support",
  "Ashlesha": "insight, intuition and careful handling of words",
  "Magha": "respect for tradition, elders and legacy",
  "Purva Phalguni": "enjoyment, romance and creative expression",
  "Uttara Phalguni": "loyalty, cooperation and dependable help",
  "Hasta": "skilful hands, practical work and precision",
  "Chitra": "design, craft and making things look right",
  "Swati": "independence, trade and flexible thinking",
  "Vishakha": "focused goals and determined effort",
  "Anuradha": "friendship, devotion and steady cooperation",
  "Jyeshtha": "seniority, protection and taking charge",
  "Mula": "getting to the root, clearing out and honesty",
  "Purva Ashadha": "confidence, persuasion and enthusiasm",
  "Uttara Ashadha": "lasting achievement and principled effort",
  "Shravana": "listening, learning and thoughtful advice",
  "Dhanishta": "rhythm, ambition and material progress",
  "Shatabhisha": "healing, research and quiet independence",
  "Purva Bhadrapada": "intensity, transformation and deep conviction",
  "Uttara Bhadrapada": "patience, depth and calm wisdom",
  "Revati": "compassion, safe journeys and gentle endings"
};

// One line of temperament per sign, used as the opener of each reading.
export const SIGN_OPENERS: string[] = [
  "Ruled by Mars, Mesha natives tend to lead with action and courage.",
  "Ruled by Venus, Vrishabha natives value comfort, steadiness and beauty.",
  "Ruled by Mercury, Mithuna natives run on curiosity and conversation.",
  "Ruled by the Moon, Karka natives are guided by feeling and care for others.",
  "Ruled by the Sun, Simha natives carry natural confidence and a wish to be seen.",
  "Ruled by Mercury, Kanya natives notice detail and like things done properly.",
  "Ruled by Venus, Tula natives seek balance, fairness and harmony.",
  "Ruled by Mars, Vrishchika natives are intense, private and determined.",
  "Ruled by Jupiter, Dhanu natives are optimistic, restless and truth-seeking.",
  "Ruled by Saturn, Makara natives are disciplined, patient and goal-driven.",
  "Ruled by Saturn, Kumbha natives are independent thinkers with a wider view.",
  "Ruled by Jupiter, Meena natives are intuitive, compassionate and imaginative."
];

// Day lords, Sunday-first (matches JS getDay()).
export const WEEKDAYS = [
  { lord: "Sun", colour: "Orange", number: 1, note: "Sunday belongs to the Sun, which favours visibility, confidence and dealing with authority." },
  { lord: "Moon", colour: "White", number: 2, note: "Monday belongs to the Moon, which favours emotional balance, family and calm decisions." },
  { lord: "Mars", colour: "Red", number: 9, note: "Tuesday belongs to Mars, which favours energy, courage and getting stuck tasks moving." },
  { lord: "Mercury", colour: "Green", number: 5, note: "Wednesday belongs to Mercury, which favours communication, trade and learning." },
  { lord: "Jupiter", colour: "Yellow", number: 3, note: "Thursday belongs to Jupiter, which favours advice, study and generosity." },
  { lord: "Venus", colour: "Pink or white", number: 6, note: "Friday belongs to Venus, which favours relationships, art and small luxuries." },
  { lord: "Saturn", colour: "Blue", number: 8, note: "Saturday belongs to Saturn, which favours discipline, patience and finishing long jobs." }
];

export const PLANET_COLOURS: Record<string, string> = {
  Sun: "Orange", Moon: "White", Mars: "Red", Mercury: "Green", Jupiter: "Yellow", Venus: "Pink", Saturn: "Blue"
};
export const PLANET_NUMBERS: Record<string, number> = {
  Sun: 1, Moon: 2, Jupiter: 3, Mercury: 5, Venus: 6, Saturn: 8, Mars: 9
};
