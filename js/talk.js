/* Talking with your pet: work out what the owner said (in any of the app's languages)
   and pick a made-up reply in the pet's translator language. Replies are invented for fun. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});

  // Lowercase, strip accents and punctuation, and pad with spaces so whole words can be matched.
  const norm = (s) => ' ' + String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ß぀-ヿ㐀-鿿]+/g, ' ').trim() + ' ';
  const CJK = /[぀-ヿ㐀-鿿]/;

  // What the owner might say, in every app language. Checked in this order.
  const KEYWORDS = {
    care: ['bath', 'shower', 'wash', 'vet', 'doctor', 'nails', 'brush', 'groom', 'medicine', 'pill', 'shot', 'haircut',
      'baño', 'bañar', 'veterinario', 'uñas', 'cepillar', 'medicina', 'pastilla', 'bain', 'douche', 'vétérinaire', 'véto', 'ongles', 'brosser', 'médicament',
      'baden', 'badewanne', 'dusche', 'tierarzt', 'krallen', 'bürsten', 'medizin', 'tablette', 'bagno', 'doccia', 'unghie', 'spazzolare',
      'banho', 'unhas', 'escovar', 'remédio', 'vacina', 'お風呂', '風呂', 'シャンプー', '病院', '獣医', '爪', 'ブラシ', '薬'],
    walk: ['walk', 'walkies', 'outside', 'park', 'stroll', 'hike', 'ride', 'trot', 'go out', 'paseo', 'pasear', 'caminar', 'parque', 'salir', 'afuera',
      'promenade', 'promener', 'balade', 'dehors', 'parc', 'sortir', 'gassi', 'spaziergang', 'spazieren', 'raus', 'draußen', 'ausritt',
      'passeggiata', 'passeggio', 'fuori', 'parco', 'uscire', 'passear', 'passeio', 'rua', 'sair', 'fora', '散歩', 'さんぽ', '外', '公園'],
    food: ['food', 'eat', 'eating', 'dinner', 'breakfast', 'lunch', 'treat', 'snack', 'hungry', 'cookie', 'carrot', 'seed', 'hay', 'lettuce', 'kibble',
      'comida', 'comer', 'cena', 'desayuno', 'almuerzo', 'premio', 'galleta', 'hambre', 'zanahoria', 'manger', 'repas', 'dîner', 'déjeuner', 'croquettes',
      'friandise', 'faim', 'goûter', 'carotte', 'essen', 'fressen', 'futter', 'leckerli', 'hunger', 'abendessen', 'frühstück', 'karotte',
      'cibo', 'mangiare', 'colazione', 'pappa', 'biscotto', 'fame', 'carota', 'jantar', 'almoço', 'petisco', 'fome', 'biscoito', 'cenoura', 'ração',
      'ごはん', 'ご飯', 'おやつ', '食べ', 'お腹', 'にんじん'],
    play: ['play', 'ball', 'toy', 'toys', 'fetch', 'game', 'throw', 'catch', 'chase', 'jugar', 'pelota', 'juguete', 'juego', 'lanzar',
      'jouer', 'balle', 'jouet', 'jeu', 'lancer', 'spielen', 'spielzeug', 'spiel', 'werfen', 'giocare', 'palla', 'gioco', 'giocattolo', 'lanciare',
      'brincar', 'bola', 'brinquedo', 'jogar', '遊', 'あそ', 'ボール', 'おもちゃ'],
    sleep: ['sleep', 'bed', 'bedtime', 'nap', 'night', 'tired', 'goodnight', 'good night', 'dormir', 'cama', 'siesta', 'noche', 'cansado', 'cansada',
      'dodo', 'sieste', 'nuit', 'fatigué', 'fatiguée', 'schlafen', 'bett', 'nickerchen', 'nacht', 'müde', 'dormire', 'letto', 'pisolino', 'notte',
      'stanco', 'stanca', 'buonanotte', 'soneca', 'noite', '寝', 'おやすみ', 'ねんね', '眠'],
    scold: ['no', 'stop', 'bad', "don't", 'dont', 'quiet', 'drop it', 'leave it', 'basta', 'malo', 'mala', 'deja', 'suelta', 'quieto', 'quieta',
      'non', 'arrête', 'vilain', 'lâche', 'nein', 'aus', 'stopp', 'böse', 'böser', 'lass das', 'cattivo', 'cattiva', 'lascia', 'smettila',
      'não', 'pare', 'chega', 'feio', 'feia', 'solta', 'ダメ', 'だめ', 'こら', 'やめ'],
    love: ['love', 'good boy', 'good girl', 'good dog', 'good kitty', 'good bunny', 'good bird', 'good pet', 'cute', 'beautiful', 'best', 'cuddle',
      'hug', 'kiss', 'sweet', 'adorable', 'te quiero', 'te amo', 'amo', 'buen chico', 'buena chica', 'lindo', 'linda', 'precioso', 'preciosa',
      'abrazo', 'beso', "je t'aime", 'aime', 'gentil', 'mignon', 'mignonne', 'câlin', 'bisou', 'lieb', 'braver', 'brave', 'süß', 'süßer',
      'kuscheln', 'kuss', 'ti voglio bene', 'bravo', 'brava', 'carino', 'carina', 'coccole', 'bacio', 'bom menino', 'boa menina', 'fofo', 'fofa',
      'abraço', 'beijo', '好き', '大好き', 'いい子', 'かわいい', '可愛い', 'よしよし'],
    howareyou: ['how are you', 'how do you feel', 'are you ok', 'are you okay', 'how is it going', "how's it going", "what's up",
      'como estas', 'que tal', 'estas bien', 'ça va', 'comment vas-tu', 'comment ça va', 'tu vas bien', "wie geht's", 'wie gehts', 'wie geht es dir',
      'alles gut', 'come stai', 'tutto bene', 'come va', 'como você está', 'tudo bem', 'como vai', '元気', '大丈夫', '調子'],
    greet: ['hi', 'hello', 'hey', 'hiya', 'morning', 'good morning', 'yo', 'hola', 'buenos días', 'salut', 'bonjour', 'coucou', 'hallo',
      'guten morgen', 'servus', 'ciao', 'buongiorno', 'salve', 'oi', 'olá', 'bom dia', 'こんにちは', 'おはよう', 'やあ', 'ただいま'],
  };
  const ORDER = ['care', 'walk', 'food', 'play', 'sleep', 'scold', 'love', 'howareyou', 'greet'];
  const COMPILED = ORDER.map((intent) => [intent, KEYWORDS[intent].map((k) => ({ k: norm(k).trim(), cjk: CJK.test(k) }))]);

  function intentOf(text) {
    const t = norm(text);
    for (const [intent, list] of COMPILED) {
      for (const { k, cjk } of list) {
        if (!k) continue;
        if (cjk ? t.includes(k) : t.includes(' ' + k + ' ')) return intent;
        // Longer words also match their endings: "walk" finds "walking", "treat" finds "treats".
        if (!cjk && k.length >= 4 && k.indexOf(' ') === -1 && t.includes(' ' + k)) return intent;
      }
    }
    return 'fallback';
  }

  // Replies per language: lines any pet can say ("all") plus dog and cat versions.
  const REPLIES = {
    en: {
      greet: { all: ['Hi! I was just thinking about you. Mostly about you and snacks.', 'Hello, my favorite human! What is the plan?'], dog: ['HI! HI! You said hi! This is the best day ever!'], cat: ["Oh. It's you. I suppose you may continue."] },
      howareyou: { all: ["I'm great! A little sleepy, a little hungry, very loved.", 'Honestly? I could use a belly rub. Otherwise excellent.'], dog: ["I'm SO good! My tail says hi too!"], cat: ["Fine. My nap was interrupted, but I'll survive."] },
      walk: { all: ['A walk? Yes! Let me find the perfect spot to sniff first.', "Outside? Yes, please! It's my favorite thing."], dog: ["WALK?! Where's the leash? Hurry, hurry, hurry!"], cat: ["A walk? Cats don't do walks. You may carry me to the window."] },
      food: { all: ['Food? You have my full attention.', 'I accept your offer. Make it a double.'], dog: ["A treat?! I'll sit! I'll roll over! I'll do both at once!"], cat: ['Finally. Breakfast was hours ago. Probably.'] },
      play: { all: ["Yes! Let's play! You throw, I'll do the rest.", "Game on! I'm going to surprise you."], dog: ['Ball! Ball! BALL! Throw it already!'], cat: ["I'll play. But only if the string moves dramatically."] },
      care: { all: ["A bath? I'm suddenly very, very busy.", "The vet? Okay, but treats help me feel brave."], dog: ["I'll be good at the vet. Then we go to the park, deal?"], cat: ["If you need me, I'll be under the bed until next week."] },
      sleep: { all: ['Good night! Wake me up for breakfast.', 'Bedtime? Only if I get the middle of the bed.'], dog: ["One more belly rub and I'm asleep."], cat: ['Sleep? I had a 3 a.m. sprint planned, but fine.'] },
      scold: { all: ["Who, me? I didn't do anything. Probably.", "Okay, okay. I'm listening. Mostly."], dog: ["Sorry! I'll be good! Are we still friends? Treat?"], cat: ["I heard you. I've decided to ignore you."] },
      love: { all: ["I love you too! You're my favorite human.", "Aww! Come closer, I'll lean on you."], dog: ["You're the best! My tail can't stop wagging!"], cat: ["I'm slow blinking at you. That means I love you too."] },
      fallback: { all: ["I heard my name and some other sounds. I'm choosing to hear 'treat'.", 'Interesting. Could you say that again, but with snacks?'] },
    },
    es: {
      greet: { all: ['¡Hola! Justo estaba pensando en ti. Sobre todo en ti y en los premios.', '¡Hola, mi humano favorito! ¿Cuál es el plan?'], dog: ['¡HOLA! ¡HOLA! ¡Me saludaste! ¡Es el mejor día de mi vida!'], cat: ['Ah. Eres tú. Supongo que puedes continuar.'] },
      howareyou: { all: ['¡Genial! Un poco de sueño, un poco de hambre y mucho amor.', '¿Sinceramente? Me vendría bien una rascadita en la panza. Por lo demás, excelente.'], dog: ['¡Estoy SÚPER bien! ¡Mi cola también te saluda!'], cat: ['Bien. Me interrumpiste la siesta, pero sobreviviré.'] },
      walk: { all: ['¿Un paseo? ¡Sí! Primero déjame encontrar el lugar perfecto para olfatear.', '¿Salir? ¡Sí, por favor! Es lo que más me gusta.'], dog: ['¿¡PASEO!? ¿Dónde está la correa? ¡Rápido, rápido, rápido!'], cat: ['¿Un paseo? Los gatos no pasean. Puedes llevarme en brazos hasta la ventana.'] },
      food: { all: ['¿Comida? Tienes toda mi atención.', 'Acepto tu oferta. Que sea doble.'], dog: ['¿¡Un premio!? ¡Me siento! ¡Ruedo! ¡Hago las dos cosas a la vez!'], cat: ['Por fin. El desayuno fue hace horas. Creo.'] },
      play: { all: ['¡Sí! ¡A jugar! Tú lanzas y yo hago el resto.', '¡Que empiece el juego! Voy a sorprenderte.'], dog: ['¡Pelota! ¡Pelota! ¡PELOTA! ¡Lánzala ya!'], cat: ['Jugaré. Pero solo si la cuerda se mueve de forma dramática.'] },
      care: { all: ['¿Baño? De repente tengo muchísimo que hacer.', '¿El veterinario? Está bien, pero los premios me dan valor.'], dog: ['Me portaré bien en el veterinario. Después vamos al parque, ¿trato hecho?'], cat: ['Si me necesitas, estaré debajo de la cama hasta la semana que viene.'] },
      sleep: { all: ['¡Buenas noches! Despiértame para el desayuno.', '¿A dormir? Solo si me toca el centro de la cama.'], dog: ['Una rascadita más y me duermo.'], cat: ['¿Dormir? Tenía planeada una carrera a las tres de la mañana, pero bueno.'] },
      scold: { all: ['¿Quién, yo? No hice nada. Probablemente.', 'Bueno, bueno. Te escucho. Más o menos.'], dog: ['¡Perdón! ¡Me portaré bien! ¿Seguimos siendo amigos? ¿Un premio?'], cat: ['Te escuché. He decidido ignorarte.'] },
      love: { all: ['¡Yo también te quiero! Eres mi humano favorito.', '¡Ay! Acércate, que me apoyo en ti.'], dog: ['¡Eres lo máximo! ¡Mi cola no para de moverse!'], cat: ['Te estoy parpadeando despacio. Eso significa que yo también te quiero.'] },
      fallback: { all: ['Escuché mi nombre y otros sonidos. Elijo entender «premio».', 'Interesante. ¿Puedes repetirlo, pero con galletas?'] },
    },
    fr: {
      greet: { all: ['Salut ! Je pensais justement à toi. Surtout à toi et aux friandises.', 'Bonjour, mon humain préféré ! On fait quoi ?'], dog: ["SALUT ! SALUT ! Tu m'as dit salut ! C'est le plus beau jour de ma vie !"], cat: ["Ah. C'est toi. Je suppose que tu peux continuer."] },
      howareyou: { all: ["Super bien ! Un peu sommeil, un peu faim, et beaucoup d'amour.", 'Franchement ? Une caresse sur le ventre serait la bienvenue. À part ça, tout va bien.'], dog: ['Je vais TROP bien ! Ma queue te dit bonjour aussi !'], cat: ['Ça va. Tu as interrompu ma sieste, mais je survivrai.'] },
      walk: { all: ["Une promenade ? Oui ! Laisse-moi d'abord trouver le coin parfait à renifler.", "Dehors ? Oui, s'il te plaît ! C'est mon activité préférée."], dog: ['PROMENADE ? Où est la laisse ? Vite, vite, vite !'], cat: ["Une promenade ? Les chats ne se promènent pas. Tu peux me porter jusqu'à la fenêtre."] },
      food: { all: ['À manger ? Tu as toute mon attention.', "J'accepte ton offre. Double portion, s'il te plaît."], dog: ["Une friandise ? Je m'assois ! Je me roule ! Je fais les deux en même temps !"], cat: ["Enfin. Le petit-déjeuner, c'était il y a des heures. Je crois."] },
      play: { all: ["Oui ! On joue ! Tu lances, je m'occupe du reste.", "C'est parti ! Je vais te surprendre."], dog: ['La balle ! La balle ! LA BALLE ! Lance-la !'], cat: ['Je veux bien jouer. Mais seulement si la ficelle bouge de façon dramatique.'] },
      care: { all: ["Un bain ? J'ai soudain énormément de choses à faire.", "Le vétérinaire ? D'accord, mais les friandises donnent du courage."], dog: ["Je serai sage chez le vétérinaire. Après, on va au parc, d'accord ?"], cat: ['Si tu me cherches, je serai sous le lit jusqu\'à la semaine prochaine.'] },
      sleep: { all: ['Bonne nuit ! Réveille-moi pour le petit-déjeuner.', "Au lit ? Seulement si j'ai le milieu du lit."], dog: ["Encore une caresse et je m'endors."], cat: ["Dormir ? J'avais prévu un sprint à trois heures du matin, mais bon."] },
      scold: { all: ["Qui, moi ? Je n'ai rien fait. Probablement.", "D'accord, d'accord. Je t'écoute. À peu près."], dog: ['Pardon ! Je serai sage ! On est toujours amis ? Une friandise ?'], cat: ["J'ai bien entendu. J'ai décidé de t'ignorer."] },
      love: { all: ["Moi aussi je t'aime ! Tu es mon humain préféré.", "Oh ! Viens plus près, je vais m'appuyer contre toi."], dog: ["Personne n'est mieux que toi ! Ma queue n'arrête pas de remuer !"], cat: ["Je te fais un clignement lent. Ça veut dire que je t'aime aussi."] },
      fallback: { all: ["J'ai entendu mon nom et d'autres sons. Je choisis d'entendre « friandise ».", 'Intéressant. Tu peux répéter, mais avec des croquettes ?'] },
    },
    de: {
      greet: { all: ['Hallo! Ich habe gerade an dich gedacht. Vor allem an dich und an Leckerlis.', 'Hallo, mein Lieblingsmensch! Was ist der Plan?'], dog: ['HALLO! HALLO! Du hast Hallo gesagt! Das ist der beste Tag meines Lebens!'], cat: ['Ach. Du bist es. Na gut, du darfst weitermachen.'] },
      howareyou: { all: ['Super! Ein bisschen müde, ein bisschen hungrig und sehr geliebt.', 'Ehrlich? Ein bisschen Bauchkraulen wäre schön. Sonst alles bestens.'], dog: ["Mir geht's SUPER! Mein Schwanz sagt auch Hallo!"], cat: ['Gut. Mein Nickerchen wurde unterbrochen, aber ich werde es überleben.'] },
      walk: { all: ['Spazieren? Ja! Lass mich zuerst die perfekte Schnüffelstelle finden.', 'Raus? Ja, bitte! Darauf habe ich gewartet.'], dog: ['GASSI?! Wo ist die Leine? Schnell, schnell, schnell!'], cat: ['Spazieren? Katzen gehen nicht spazieren. Du darfst mich zum Fenster tragen.'] },
      food: { all: ['Essen? Du hast meine volle Aufmerksamkeit.', 'Ich nehme dein Angebot an. Bitte die doppelte Portion.'], dog: ['Ein Leckerli?! Ich mache Sitz! Ich rolle mich! Ich mache beides gleichzeitig!'], cat: ['Endlich. Das Frühstück ist Stunden her. Glaube ich.'] },
      play: { all: ['Ja! Lass uns spielen! Du wirfst, ich mache den Rest.', "Los geht's! Ich werde dich überraschen."], dog: ['Ball! Ball! BALL! Wirf ihn endlich!'], cat: ['Ich spiele mit. Aber nur, wenn sich die Schnur dramatisch bewegt.'] },
      care: { all: ['Baden? Ich habe plötzlich sehr viel zu tun.', 'Zum Tierarzt? Okay, aber Leckerlis machen mich mutig.'], dog: ['Ich bin brav beim Tierarzt. Danach gehen wir in den Park, abgemacht?'], cat: ['Falls du mich suchst: Ich bin bis nächste Woche unter dem Bett.'] },
      sleep: { all: ['Gute Nacht! Weck mich zum Frühstück.', 'Ins Bett? Nur, wenn ich die Mitte bekomme.'], dog: ['Noch einmal kraulen, dann schlafe ich.'], cat: ['Schlafen? Ich hatte einen Sprint um drei Uhr nachts geplant, aber na gut.'] },
      scold: { all: ['Wer, ich? Ich habe nichts gemacht. Wahrscheinlich.', 'Okay, okay. Ich höre zu. Meistens.'], dog: ['Entschuldigung! Ich bin brav! Sind wir noch Freunde? Leckerli?'], cat: ['Ich habe dich gehört. Ich habe beschlossen, dich zu ignorieren.'] },
      love: { all: ['Ich hab dich auch lieb! Du bist mein Lieblingsmensch.', 'Oh! Komm näher, ich lehne mich an dich.'], dog: ['Keiner ist so toll wie du! Mein Schwanz hört nicht auf zu wedeln!'], cat: ['Ich blinzle dich langsam an. Das heißt, ich hab dich auch lieb.'] },
      fallback: { all: ['Ich habe meinen Namen und ein paar andere Geräusche gehört. Ich entscheide mich für „Leckerli“.', 'Interessant. Kannst du das noch mal sagen, aber mit Snacks?'] },
    },
    it: {
      greet: { all: ['Ciao! Stavo proprio pensando a te. Soprattutto a te e ai premietti.', 'Ciao, il mio umano preferito! Qual è il piano?'], dog: ['CIAO! CIAO! Mi hai salutato! È il giorno più bello della mia vita!'], cat: ['Ah. Sei tu. Suppongo che tu possa continuare.'] },
      howareyou: { all: ["Benissimo! Un po' di sonno, un po' di fame e tanto amore.", 'Sinceramente? Una grattatina sulla pancia ci starebbe bene. Per il resto, tutto ottimo.'], dog: ['Sto BENISSIMO! Anche la mia coda ti saluta!'], cat: ['Bene. Mi hai interrotto il pisolino, ma sopravvivrò.'] },
      walk: { all: ['Una passeggiata? Sì! Prima fammi trovare il punto perfetto da annusare.', 'Fuori? Sì, per favore! È la mia attività preferita.'], dog: ["PASSEGGIATA?! Dov'è il guinzaglio? Presto, presto, presto!"], cat: ['Una passeggiata? I gatti non passeggiano. Puoi portarmi in braccio fino alla finestra.'] },
      food: { all: ['Cibo? Hai tutta la mia attenzione.', 'Accetto la tua offerta. Porzione doppia, grazie.'], dog: ['Un premio?! Mi siedo! Rotolo! Faccio tutte e due le cose insieme!'], cat: ['Finalmente. La colazione è stata ore fa. Credo.'] },
      play: { all: ['Sì! Giochiamo! Tu lanci, io faccio il resto.', 'Si gioca! Ti sorprenderò.'], dog: ['Palla! Palla! PALLA! Lanciala!'], cat: ['Gioco volentieri. Ma solo se il filo si muove in modo drammatico.'] },
      care: { all: ["Il bagno? All'improvviso ho tantissime cose da fare.", "Il veterinario? D'accordo, ma i premietti mi danno coraggio."], dog: ['Mi comporterò bene dal veterinario. Poi andiamo al parco, affare fatto?'], cat: ['Se mi cerchi, sono sotto il letto fino alla settimana prossima.'] },
      sleep: { all: ['Buonanotte! Svegliami per la colazione.', 'A letto? Solo se mi tocca il centro del letto.'], dog: ['Ultima grattatina e poi nanna.'], cat: ['Dormire? Avevo in programma una corsa alle tre di notte, ma va bene.'] },
      scold: { all: ['Chi, io? Non ho fatto niente. Probabilmente.', 'Va bene, va bene. Ti ascolto. Più o meno.'], dog: ['Scusa! Da ora in poi mi comporto bene! Siamo ancora amici? Un premietto?'], cat: ['Ti ho sentito. Ho deciso di ignorarti.'] },
      love: { all: ["Anch'io ti voglio bene! Sei il mio umano preferito.", 'Oh! Vieni più vicino, mi appoggio a te.'], dog: ['Nessuno è come te! La mia coda non smette di scodinzolare!'], cat: ["Ti sto facendo l'occhiolino lento. Vuol dire che ti voglio bene anch'io."] },
      fallback: { all: ['Ho sentito il mio nome e altri suoni. Scelgo di capire «premietto».', 'Interessante. Puoi ripeterlo, ma con i biscotti?'] },
    },
    pt: {
      greet: { all: ['Oi! Eu estava pensando em você. Principalmente em você e em petiscos.', 'Olá, meu humano favorito! Qual é o plano?'], dog: ['OI! OI! Você disse oi! É o melhor dia da minha vida!'], cat: ['Ah. É você. Acho que pode continuar.'] },
      howareyou: { all: ['Ótimo! Um pouco de sono, um pouco de fome e muito amor.', 'Sinceramente? Um carinho na barriga cairia bem. Fora isso, tudo ótimo.'], dog: ['Estou SUPER bem! Meu rabo também diz oi!'], cat: ['Bem. Você interrompeu minha soneca, mas vou sobreviver.'] },
      walk: { all: ['Passear? Sim! Primeiro deixa eu achar o lugar perfeito para cheirar.', 'Lá fora? Sim, por favor! É minha atividade favorita.'], dog: ['PASSEAR?! Cadê a coleira? Rápido, rápido, rápido!'], cat: ['Passear? Gatos não passeiam. Você pode me carregar até a janela.'] },
      food: { all: ['Comida? Você tem toda a minha atenção.', 'Aceito sua oferta. Porção dupla, por favor.'], dog: ['Petisco?! Eu sento! Eu rolo! Faço as duas coisas ao mesmo tempo!'], cat: ['Até que enfim. O café da manhã foi há horas. Eu acho.'] },
      play: { all: ['Sim! Vamos brincar! Você joga, eu faço o resto.', 'Valendo! Vou te surpreender.'], dog: ['Bola! Bola! BOLA! Joga logo!'], cat: ['Eu brinco. Mas só se a cordinha se mexer de um jeito dramático.'] },
      care: { all: ['Banho? De repente tenho muita coisa para fazer.', 'Veterinário? Tudo bem, mas petiscos me dão coragem.'], dog: ['Vou me comportar no veterinário. Depois a gente vai ao parque, combinado?'], cat: ['Se precisar de mim, vou estar debaixo da cama até a semana que vem.'] },
      sleep: { all: ['Boa noite! Me acorda para o café da manhã.', 'Hora de dormir? Só se eu ficar no meio da cama.'], dog: ['Só mais um carinho e eu durmo.'], cat: ['Dormir? Eu tinha planejado uma corrida às três da manhã, mas tudo bem.'] },
      scold: { all: ['Quem, eu? Não fiz nada. Provavelmente.', 'Tá bom, tá bom. Estou ouvindo. Mais ou menos.'], dog: ['Desculpa! Vou me comportar! Ainda somos amigos? Petisco?'], cat: ['Eu ouvi. Decidi te ignorar.'] },
      love: { all: ['Eu também te amo! Você é meu humano favorito.', 'Ah! Chega mais perto, vou me encostar em você.'], dog: ['Você é demais! Meu rabo não para de abanar!'], cat: ['Estou piscando devagar para você. Isso quer dizer que eu também te amo.'] },
      fallback: { all: ['Ouvi meu nome e alguns outros sons. Escolho entender “petisco”.', 'Interessante. Pode repetir, mas com biscoitos?'] },
    },
    ja: {
      greet: { all: ['やあ！ちょうどきみのことを考えてたよ。きみとおやつのことをね。', 'こんにちは、いちばん好きな人間さん！今日はなにする？'], dog: ['やあ！やあ！あいさつしてくれた！人生でいちばんいい日だ！'], cat: ['あら。きみか。まあ、続けていいよ。'] },
      howareyou: { all: ['元気だよ！ちょっと眠くて、ちょっとお腹がすいてて、とっても幸せ。', '正直に言うと？お腹をなでてくれたら最高。それ以外はばっちり。'], dog: ['すっごく元気！しっぽもあいさつしてるよ！'], cat: ['まあまあ。お昼寝をじゃまされたけど、なんとか生きてる。'] },
      walk: { all: ['おさんぽ？行く！まずはにおいをかぐのにぴったりの場所を探させて。', 'お外？行きたい！いちばん好きなことだよ。'], dog: ['さんぽ？！リードはどこ？早く、早く、早く！'], cat: ['おさんぽ？ねこはさんぽしないの。窓まで抱っこしてくれてもいいよ。'] },
      food: { all: ['ごはん？全力で聞いてるよ。', 'その提案、受けよう。大盛りでお願い。'], dog: ['おやつ？！おすわりする！ゴロンする！両方いっぺんにする！'], cat: ['やっと。朝ごはんから何時間もたってるんだけど。たぶん。'] },
      play: { all: ['遊ぼう！投げてくれたら、あとはまかせて。', '勝負だ！びっくりさせてあげる。'], dog: ['ボール！ボール！ボール！早く投げて！'], cat: ['遊んであげてもいいよ。ひもがドラマチックに動くならね。'] },
      care: { all: ['お風呂？急に用事を思い出しちゃった。', '病院？いいよ。でもおやつがあると勇気が出るんだ。'], dog: ['病院ではいい子にするよ。そのあと公園に行こうね、約束だよ？'], cat: ['用があったら、来週までベッドの下にいるから。'] },
      sleep: { all: ['おやすみ！朝ごはんの時間に起こしてね。', 'もう寝るの？ベッドの真ん中をくれるならいいよ。'], dog: ['あとひとなでしてくれたら寝るね。'], cat: ['寝る？夜中の3時に走り回る予定だったけど、まあいいか。'] },
      scold: { all: ['え、だれのこと？なにもしてないよ。たぶん。', 'わかった、わかった。聞いてるよ。だいたいね。'], dog: ['ごめんね！いい子にするから！まだ友だち？おやつは？'], cat: ['聞こえてたよ。無視することに決めたけど。'] },
      love: { all: ['大好きだよ！きみはいちばん好きな人間だよ。', 'わあ！もっと近くに来て。寄りかかるから。'], dog: ['きみは最高！しっぽが止まらないよ！'], cat: ['ゆっくりまばたきしてるの。わたしも大好きって意味だよ。'] },
      fallback: { all: ['名前と、ほかにもいろんな音が聞こえたよ。「おやつ」って聞こえたことにするね。', 'おもしろいね。もう一回言って。今度はおやつ付きで。'] },
    },
  };

  // French typography: no-break space before ! ? : ; and inside « ».
  for (const intent of Object.keys(REPLIES.fr)) {
    for (const group of Object.keys(REPLIES.fr[intent])) {
      REPLIES.fr[intent][group] = REPLIES.fr[intent][group].map((s) =>
        s.replace(/ ([!?:;»])/g, ' $1').replace(/« /g, '« '));
    }
  }

  const MOOD_FOR = { greet: 'happy', walk: 'excited', food: 'hungry', play: 'playful', care: 'nervous', sleep: 'sleepy', scold: 'sassy', love: 'loving' };

  // r is the pet's simulation runtime (current mood, recent lines).
  function reply(pet, said, r) {
    const intent = intentOf(said);
    if (intent === 'fallback' && Math.random() < 0.5) {
      const t = Paw.sim.makeThought(pet, r.mood || 'happy', Date.now(), Math.random, r.recent);
      return { intent, mood: t.mood, text: t.text, key: t.key };
    }
    const bank = (REPLIES[Paw.sim.langShort(pet.translator.lang)] || REPLIES.en)[intent];
    const pool = bank.all.map((t, i) => ({ t, k: 'talk.' + intent + '.a' + i }))
      .concat((bank[pet.species] || []).map((t, i) => ({ t, k: 'talk.' + intent + '.' + pet.species + i })));
    const recent = r.recentTalk || (r.recentTalk = []);
    const fresh = pool.filter((p) => recent.indexOf(p.k) === -1);
    const from = fresh.length ? fresh : pool;
    const choice = from[Math.floor(Math.random() * from.length)];
    recent.push(choice.k);
    if (recent.length > 4) recent.shift();
    let mood = MOOD_FOR[intent] || r.mood || 'happy';
    if (intent === 'walk' && pet.species === 'cat') mood = 'sassy';
    if (intent === 'scold' && pet.species === 'dog') mood = 'nervous';
    return { intent, mood, text: choice.t, key: choice.k };
  }

  // The reply line for a key in another language (used to re-translate and for voice fallback).
  function line(key, lang) {
    const m = /^talk\.(\w+)\.(a|[a-z]+?)(\d+)$/.exec(key || '');
    if (!m) return null;
    const bank = (REPLIES[Paw.sim.langShort(lang)] || {})[m[1]];
    const list = bank && (m[2] === 'a' ? bank.all : bank[m[2]]);
    return (list && list[Number(m[3])]) || null;
  }

  // Ready-made things to say, shown as quick buttons in the interface language. Each one must
  // still match its intent above: walk, food, play, love, care, how are you, sleep.
  const QUICK = {
    en: ['Want to go for a walk?', 'Dinner time!', 'Want to play?', "Who's the best? You are!", 'Bath time!', 'How are you?', 'Good night!'],
    es: ['¿Vamos de paseo?', '¡Hora de cenar!', '¿Quieres jugar?', '¡Eres el mejor! Te quiero.', '¡Hora del baño!', '¿Cómo estás?', '¡Buenas noches!'],
    fr: ['On va se promener ?', 'C’est l’heure du dîner !', 'Tu veux jouer ?', 'Tu es le meilleur ! Je t’aime.', 'C’est l’heure du bain !', 'Comment ça va ?', 'Bonne nuit !'],
    de: ['Gehen wir Gassi?', 'Essenszeit!', 'Willst du spielen?', 'Du bist der Beste! Ich hab dich lieb.', 'Zeit zum Baden!', 'Wie geht’s dir?', 'Gute Nacht!'],
    it: ['Andiamo a fare una passeggiata?', 'È ora di cena!', 'Vuoi giocare?', 'Sei il migliore! Ti voglio bene.', 'È l’ora del bagno!', 'Come stai?', 'Buonanotte!'],
    pt: ['Vamos passear?', 'Hora do jantar!', 'Quer brincar?', 'Você é o melhor! Eu te amo.', 'Hora do banho!', 'Como você está?', 'Boa noite!'],
    ja: ['お散歩に行く？', 'ごはんの時間だよ！', '遊ぼうか？', 'いちばんいい子は誰？きみだよ！', 'お風呂の時間だよ！', '元気？', 'おやすみ！'],
  };
  const quick = (lang) => QUICK[lang] || QUICK.en;

  Paw.talk = { intentOf, reply, line, quick, QUICK };
})();
