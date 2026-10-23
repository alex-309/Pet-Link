/* The made-up "translations". Pets do not speak human languages; every line here
   is invented for the demo. Each mood has lines any pet can say ("all") plus a
   few dog- and cat-specific ones. Lines avoid brand names and are family-friendly. */
(function () {
  'use strict';
  const Paw = (window.Paw = window.Paw || {});

  const bank = {
    en: {
      happy: {
        all: ['Today is a very good day. Maybe the best day.', "I'm so happy you're here!", "Everything is perfect. Don't change a thing."],
        dog: ['My tail is wagging so fast I might take off!', "You're home! You're HOME! Best moment of my life!"],
        cat: ['I am purring. Do not let it go to your head.', 'This sunbeam and I have reached an understanding.'],
      },
      playful: {
        all: ["Let's play! I have so much energy right now.", "Tag, you're it!", 'Is that a toy? Is EVERYTHING a toy?'],
        dog: ['Throw the ball! Again! Again!', "I found a stick. It's the best stick. You may admire it."],
        cat: ['Wiggle the string. Faster. FASTER.', "I'm about to pounce on your toes. Fair warning."],
      },
      excited: {
        all: ["Something amazing is happening and I don't know what it is!", 'Zoomies! Clear the hallway!', "I can't sit still! I just can't!"],
        dog: ['Was that a squirrel? Was it a squirrel? I need to know!', "Did someone say walk? I heard walk!"],
        cat: ['Three a.m. sprint practice. Out of my way!', "There's a bug on the wall. This is the most important moment of my life."],
      },
      hungry: {
        all: ['Is it dinner time? It feels like dinner time.', 'My bowl looks suspiciously empty.', 'I smell something delicious. Share?'],
        dog: ["I'd do anything for one tiny treat. Sit, roll over, you name it.", "I've been very good. Very good dogs get snacks."],
        cat: ['Breakfast was hours ago. I am wasting away.', 'I can see the bottom of my bowl. This is an emergency.'],
      },
      sleepy: {
        all: ['Five more minutes. Maybe five more hours.', 'I was dreaming about chasing something. I almost caught it!', 'Blanket. Warm. Perfect. Good night.'],
        dog: ['That walk wore me out. Totally worth it.', 'Wake me up if someone opens a bag of chips.'],
        cat: ["I've only napped eleven times today. Time for number twelve.", 'Do not disturb. Cozy mode is on.'],
      },
      curious: {
        all: ["What's that smell? I must investigate.", "Ooh, what's over there?", 'I heard a noise. I need to check it out.'],
        dog: ['This fire hydrant has so many messages today.', 'Every bush on this street has a story to tell.'],
        cat: ["Why is this box here? It's mine now.", "What's inside that closet? Open it. For science."],
      },
      loving: {
        all: ["You're my favorite human in the whole world.", 'Can we cuddle? Just for a little while. Or forever.', 'I feel safe when you are around.'],
        dog: ['Let me lean on you. This is how I hug.', "I'd share my favorite toy with you. Probably."],
        cat: ["I'm giving you a slow blink. That means I love you.", "I brought you a gift. You're welcome."],
      },
      nervous: {
        all: ["What was that sound? I don't like that sound.", 'Please stay close for a minute.', "Is that the vacuum? I don't trust the vacuum."],
        dog: ['The doorbell rang! Who is it? Why is it?', "That umbrella opened by itself. I'm keeping an eye on it."],
        cat: ["The new rug smells strange. I'll be under the bed.", 'Someone moved my favorite chair. Nothing is safe anymore.'],
      },
      sassy: {
        all: ['Excuse me, I was promised snacks.', "I'll come when I feel like it.", 'Did you just pet me the wrong way?'],
        dog: ["I heard you. I'm choosing not to listen.", "That's not my sock. I've never seen that sock."],
        cat: ["I knocked it off the table. And I'd do it again.", "Your keyboard is warm. It's my bed now."],
      },
    },
    es: {
      happy: {
        all: ['Hoy es un día muy bueno. Quizás el mejor día.', '¡Qué feliz estoy de que estés aquí!', 'Todo está perfecto. No cambies nada.'],
        dog: ['¡Muevo la cola tan rápido que podría despegar!', '¡Llegaste! ¡LLEGASTE! ¡Es el mejor momento de mi vida!'],
        cat: ['Estoy ronroneando. Que no se te suba a la cabeza.', 'Este rayito de sol y yo hemos llegado a un acuerdo.'],
      },
      playful: {
        all: ['¡A jugar! Tengo muchísima energía ahora mismo.', '¡Te atrapé! Ahora tú la llevas.', '¿Eso es un juguete? ¿TODO es un juguete?'],
        dog: ['¡Tira la pelota! ¡Otra vez! ¡Otra vez!', 'Encontré un palo. Es el mejor palo. Puedes admirarlo.'],
        cat: ['Mueve la cuerda. Más rápido. ¡MÁS RÁPIDO!', 'Voy a lanzarme sobre tus pies. Te lo advierto.'],
      },
      excited: {
        all: ['¡Está pasando algo increíble y no sé qué es!', '¡Modo turbo! ¡Despejen el pasillo!', '¡No puedo dejar de moverme! ¡No puedo!'],
        dog: ['¿Eso fue una ardilla? ¿Era una ardilla? ¡Necesito saberlo!', '¿Alguien dijo «paseo»? ¡Escuché «paseo»!'],
        cat: ['Carrera de las tres de la mañana. ¡Abran paso!', 'Hay un bicho en la pared. Es el momento más importante de mi vida.'],
      },
      hungry: {
        all: ['¿Ya es hora de cenar? Parece hora de cenar.', 'Mi plato se ve sospechosamente vacío.', 'Huele a algo delicioso. ¿Compartimos?'],
        dog: ['Haría lo que fuera por un premio chiquito. Sentarme, rodar, lo que pidas.', 'Me he portado muy bien. Los perros buenos reciben premios.'],
        cat: ['El desayuno fue hace horas. Me estoy consumiendo.', 'Se ve el fondo de mi plato. Esto es una emergencia.'],
      },
      sleepy: {
        all: ['Cinco minutos más. O cinco horas más.', 'Soñaba que perseguía algo. ¡Casi lo atrapo!', 'Manta. Calentita. Perfecto. Buenas noches.'],
        dog: ['Ese paseo me dejó sin energía. Valió la pena.', 'Despiértame si alguien abre un paquete de galletas.'],
        cat: ['Hoy solo he tomado once siestas. Toca la número doce.', 'No molestar. Estoy en modo acogedor.'],
      },
      curious: {
        all: ['¿Qué es ese olor? Tengo que investigar.', 'Uy, ¿qué hay por allá?', 'Escuché un ruido. Tengo que ir a ver.'],
        dog: ['Este poste tiene muchísimos mensajes hoy.', 'Cada arbusto de esta calle tiene una historia que contar.'],
        cat: ['¿Por qué está esta caja aquí? Ahora es mía.', '¿Qué hay dentro de ese armario? Ábrelo. Por la ciencia.'],
      },
      loving: {
        all: ['Eres mi humano favorito en todo el mundo.', '¿Nos acurrucamos? Solo un ratito. O para siempre.', 'Me siento a salvo cuando estás cerca.'],
        dog: ['Déjame apoyarme en ti. Así es como abrazo.', 'Compartiría mi juguete favorito contigo. Probablemente.'],
        cat: ['Te estoy parpadeando despacio. Eso significa que te quiero.', 'Te traje un regalo. De nada.'],
      },
      nervous: {
        all: ['¿Qué fue ese ruido? No me gusta ese ruido.', 'Quédate cerca un momento, por favor.', '¿Esa es la aspiradora? No confío en la aspiradora.'],
        dog: ['¡Sonó el timbre! ¿Quién es? ¿Por qué?', 'Ese paraguas se abrió solo. Lo estoy vigilando.'],
        cat: ['La alfombra nueva huele raro. Estaré debajo de la cama.', 'Alguien movió mi silla favorita. Ya nada es seguro.'],
      },
      sassy: {
        all: ['Disculpa, me prometieron premios.', 'Iré cuando yo quiera.', '¿Me acabas de acariciar a contrapelo?'],
        dog: ['Te escuché. Elijo no hacerte caso.', 'Ese no es mi calcetín. Nunca he visto ese calcetín.'],
        cat: ['Lo tiré de la mesa. Y lo volvería a hacer.', 'Tu teclado está calentito. Ahora es mi cama.'],
      },
    },
    fr: {
      happy: {
        all: ["Aujourd'hui est une très bonne journée. Peut-être la meilleure.", 'Quel bonheur que tu sois là !', 'Tout est parfait. Ne change rien.'],
        dog: ['Ma queue remue si vite que je pourrais décoller !', "Te revoilà ! TE REVOILÀ ! C'est le plus beau moment de ma vie !"],
        cat: ['Je ronronne. Que ça ne te monte pas à la tête.', 'Ce rayon de soleil et moi avons trouvé un accord.'],
      },
      playful: {
        all: ["On joue ? J'ai tellement d'énergie !", "Touché ! C'est toi le chat !", "C'est un jouet ? Est-ce que TOUT est un jouet ?"],
        dog: ['Lance la balle ! Encore ! Encore !', "J'ai trouvé un bâton. C'est le meilleur bâton. Tu peux l'admirer."],
        cat: ['Agite la ficelle. Plus vite. PLUS VITE.', "Je vais bondir sur tes orteils. Je t'aurai prévenu."],
      },
      excited: {
        all: ['Il se passe un truc génial et je ne sais pas quoi !', 'Mode turbo ! Libérez le couloir !', 'Je ne tiens plus en place ! Impossible !'],
        dog: ["C'était un écureuil ? C'ÉTAIT UN ÉCUREUIL ? Je dois savoir !", "Quelqu'un a dit « promenade » ? J'ai entendu « promenade » !"],
        cat: ['Sprint de trois heures du matin. Poussez-vous !', "Il y a un insecte sur le mur. C'est le moment le plus important de ma vie."],
      },
      hungry: {
        all: ["C'est l'heure du dîner ? On dirait l'heure du dîner.", "Ma gamelle a l'air étrangement vide.", 'Ça sent super bon. On partage ?'],
        dog: ["Je ferais n'importe quoi pour une petite friandise. Assis, roulé-boulé, tout ce que tu veux.", "J'ai été très sage. Les chiens sages ont droit à un goûter."],
        cat: ["Le petit-déjeuner, c'était il y a des heures. Je dépéris.", "On voit le fond de ma gamelle. C'est une urgence."],
      },
      sleepy: {
        all: ['Encore cinq minutes. Ou cinq heures.', "Je rêvais que je poursuivais quelque chose. Je l'ai presque attrapé !", 'Couverture. Bien au chaud. Parfait. Bonne nuit.'],
        dog: ['Grosse promenade, grosse sieste. Ça valait le coup.', "Réveille-moi si quelqu'un ouvre un paquet de chips."],
        cat: ["Je n'ai fait que onze siestes aujourd'hui. Place à la douzième.", 'Ne pas déranger. Mode cocon activé.'],
      },
      curious: {
        all: ["C'est quoi cette odeur ? Je dois enquêter.", "Oh, qu'est-ce qu'il y a là-bas ?", "J'ai entendu un bruit. Je dois aller voir."],
        dog: ["Cette borne à incendie a plein de messages aujourd'hui.", 'Chaque buisson de cette rue a une histoire à raconter.'],
        cat: ['Pourquoi ce carton est là ? Il est à moi maintenant.', "Qu'y a-t-il dans ce placard ? Ouvre-le. Pour la science."],
      },
      loving: {
        all: ['Tu es mon humain préféré au monde entier.', 'On se fait un câlin ? Juste un petit moment. Ou pour toujours.', 'Je me sens en sécurité quand tu es là.'],
        dog: ["Laisse-moi m'appuyer contre toi. C'est comme ça que je fais des câlins.", 'Je partagerais mon jouet préféré avec toi. Probablement.'],
        cat: ["Je te fais un clignement lent. Ça veut dire que je t'aime.", "Je t'ai apporté un cadeau. De rien."],
      },
      nervous: {
        all: ["C'était quoi ce bruit ? Je n'aime pas ce bruit.", "Reste près de moi une minute, s'il te plaît.", "C'est l'aspirateur ? Je ne fais pas confiance à l'aspirateur."],
        dog: ["On a sonné ! Qui c'est ? Pourquoi ?", "Ce parapluie s'est ouvert tout seul. Je le surveille."],
        cat: ['Le nouveau tapis sent bizarre. Je serai sous le lit.', "Quelqu'un a déplacé mon fauteuil préféré. Plus rien n'est sûr."],
      },
      sassy: {
        all: ["Excuse-moi, on m'avait promis des friandises.", "Je viendrai quand j'en aurai envie.", 'Tu viens de me caresser à rebrousse-poil ?'],
        dog: ["J'ai bien entendu. Je choisis de ne pas écouter.", "Ce n'est pas ma chaussette. Je n'ai jamais vu cette chaussette."],
        cat: ["Je l'ai fait tomber de la table. Et je recommencerais.", "Ton clavier est tout chaud. C'est mon lit maintenant."],
      },
    },
    de: {
      happy: {
        all: ['Heute ist ein sehr guter Tag. Vielleicht der beste.', 'Ich bin so froh, dass du da bist!', 'Alles ist perfekt. Bloß nichts ändern.'],
        dog: ['Mein Schwanz wedelt so schnell, ich könnte abheben!', 'Du bist zurück! Du bist ZURÜCK! Der schönste Moment meines Lebens!'],
        cat: ['Ich schnurre. Bild dir bloß nichts darauf ein.', 'Dieser Sonnenstrahl und ich haben uns geeinigt.'],
      },
      playful: {
        all: ['Lass uns spielen! Ich habe gerade so viel Energie.', 'Fangen! Du bist dran!', 'Ist das ein Spielzeug? Ist ALLES ein Spielzeug?'],
        dog: ['Wirf den Ball! Nochmal! Nochmal!', 'Ich habe einen Stock gefunden. Den besten Stock. Du darfst ihn bewundern.'],
        cat: ['Wackel mit der Schnur. Schneller. SCHNELLER.', 'Gleich springe ich auf deine Zehen. Nur zur Warnung.'],
      },
      excited: {
        all: ['Gerade passiert etwas Großartiges und ich weiß nicht, was!', 'Turbo-Modus! Flur freimachen!', 'Ich kann nicht stillsitzen! Es geht einfach nicht!'],
        dog: ['War das ein Eichhörnchen? WAR DAS EIN EICHHÖRNCHEN? Ich muss es wissen!', 'Hat jemand „Gassi“ gesagt? Ich habe „Gassi“ gehört!'],
        cat: ['Sprint um drei Uhr nachts. Aus dem Weg!', 'Da ist ein Käfer an der Wand. Das ist der wichtigste Moment meines Lebens.'],
      },
      hungry: {
        all: ['Ist schon Zeit fürs Abendessen? Fühlt sich so an.', 'Mein Napf sieht verdächtig leer aus.', 'Hier riecht es lecker. Teilen wir?'],
        dog: ['Ich würde alles für ein winziges Leckerli tun. Sitz, Rolle, was du willst.', 'Ich war sehr brav. Brave Hunde bekommen Snacks.'],
        cat: ['Das Frühstück ist Stunden her. Ich verhungere.', 'Man sieht den Boden meines Napfes. Das ist ein Notfall.'],
      },
      sleepy: {
        all: ['Noch fünf Minuten. Vielleicht fünf Stunden.', 'Ich habe geträumt, dass ich etwas jage. Fast hätte ich es erwischt!', 'Decke. Warm. Perfekt. Gute Nacht.'],
        dog: ['Der Spaziergang hat mich geschafft. Hat sich gelohnt.', 'Weck mich, wenn jemand eine Chipstüte aufmacht.'],
        cat: ['Ich habe heute erst elf Nickerchen gemacht. Zeit für das zwölfte.', 'Bitte nicht stören. Kuschelmodus aktiv.'],
      },
      curious: {
        all: ['Was riecht hier so? Das muss ich untersuchen.', 'Oh, was ist denn da drüben?', 'Ich habe ein Geräusch gehört. Ich muss nachsehen.'],
        dog: ['Dieser Hydrant hat heute so viele Nachrichten.', 'Jeder Busch in dieser Straße hat eine Geschichte zu erzählen.'],
        cat: ['Warum steht dieser Karton hier? Jetzt gehört er mir.', 'Was ist in diesem Schrank? Mach ihn auf. Für die Wissenschaft.'],
      },
      loving: {
        all: ['Du bist mein Lieblingsmensch auf der ganzen Welt.', 'Kuscheln wir? Nur ein bisschen. Oder für immer.', 'Wenn du da bist, fühle ich mich sicher.'],
        dog: ['Lass mich an dich lehnen. So umarme ich.', 'Ich würde mein Lieblingsspielzeug mit dir teilen. Wahrscheinlich.'],
        cat: ['Ich blinzle dich langsam an. Das heißt, ich hab dich lieb.', 'Ich habe dir ein Geschenk mitgebracht. Gern geschehen.'],
      },
      nervous: {
        all: ['Was war das für ein Geräusch? Das gefällt mir nicht.', 'Bleib bitte kurz in meiner Nähe.', 'Ist das der Staubsauger? Dem Staubsauger traue ich nicht.'],
        dog: ['Es hat geklingelt! Wer ist da? Warum?', 'Der Regenschirm ist von allein aufgegangen. Ich behalte ihn im Auge.'],
        cat: ['Der neue Teppich riecht komisch. Ich bin unter dem Bett.', 'Jemand hat meinen Lieblingssessel verschoben. Nichts ist mehr sicher.'],
      },
      sassy: {
        all: ['Entschuldigung, mir wurden Leckerlis versprochen.', 'Ich komme, wann es mir passt.', 'Hast du mich gerade gegen den Strich gestreichelt?'],
        dog: ['Ich hab dich gehört. Ich entscheide mich, nicht zuzuhören.', 'Das ist nicht meine Socke. Diese Socke habe ich noch nie gesehen.'],
        cat: ['Ich habe es vom Tisch geschubst. Und ich würde es wieder tun.', 'Deine Tastatur ist schön warm. Das ist jetzt mein Bett.'],
      },
    },
    it: {
      happy: {
        all: ['Oggi è una giornata bellissima. Forse la migliore.', 'Che bello che tu sia qui!', 'È tutto perfetto. Non cambiare niente.'],
        dog: ['Scodinzolo così forte che potrei decollare!', 'Eccoti! ECCOTI! È il momento più bello della mia vita!'],
        cat: ['Sto facendo le fusa. Non montarti la testa.', 'Io e questo raggio di sole abbiamo trovato un accordo.'],
      },
      playful: {
        all: ['Giochiamo! Ho un sacco di energia adesso.', 'Ce l\'hai! Tocca a te!', 'È un giocattolo? È TUTTO un giocattolo?'],
        dog: ['Lancia la palla! Ancora! Ancora!', 'Ho trovato un bastone. È il bastone migliore. Puoi ammirarlo.'],
        cat: ['Muovi il filo. Più veloce. PIÙ VELOCE.', 'Sto per balzarti sui piedi. Ti ho avvisato.'],
      },
      excited: {
        all: ['Sta succedendo qualcosa di fantastico e non so cosa!', 'Modalità turbo! Liberate il corridoio!', 'Non riesco a smettere di muovermi!'],
        dog: ['Era uno scoiattolo? ERA UNO SCOIATTOLO? Devo saperlo!', 'Qualcuno ha detto «passeggiata»? Ho sentito «passeggiata»!'],
        cat: ['Corsa delle tre di notte. Fate largo!', "C'è un insetto sul muro. È il momento più importante della mia vita."],
      },
      hungry: {
        all: ['È già ora di cena? Sembra proprio ora di cena.', 'La mia ciotola sembra sospettosamente vuota.', 'Sento un profumino delizioso. Facciamo a metà?'],
        dog: ['Farei qualsiasi cosa per un bocconcino. Seduto, rotolo, quello che vuoi.', 'Oggi mi merito un premio. I cani bravi ricevono snack.'],
        cat: ['La colazione è stata ore fa. Sto deperendo.', "Si vede il fondo della ciotola. È un'emergenza."],
      },
      sleepy: {
        all: ['Ancora cinque minuti. O cinque ore.', "Sognavo di inseguire qualcosa. L'avevo quasi preso!", 'Coperta. Calduccio. Perfetto. Buonanotte.'],
        dog: ['Che passeggiata! Ne valeva la pena.', 'Svegliami se qualcuno apre un pacchetto di patatine.'],
        cat: ['Oggi ho fatto solo undici pisolini. È ora del dodicesimo.', 'Non disturbare. Modalità coccole attiva.'],
      },
      curious: {
        all: ["Cos'è quest'odore? Devo indagare.", "Oh, cosa c'è laggiù?", 'Ho sentito un rumore. Devo andare a vedere.'],
        dog: ['Questo idrante oggi ha un sacco di messaggi.', 'Ogni cespuglio di questa strada ha una storia da raccontare.'],
        cat: ["Perché c'è questa scatola qui? Ora è mia.", "Cosa c'è in quell'armadio? Aprilo. Per la scienza."],
      },
      loving: {
        all: ['Sei il mio umano preferito al mondo.', 'Ci coccoliamo? Solo un pochino. O per sempre.', 'Quando ci sei tu mi sento al sicuro.'],
        dog: ['Lasciami appoggiare a te. È così che abbraccio.', 'Condividerei con te il mio gioco preferito. Probabilmente.'],
        cat: ['Ti sto facendo l\'occhiolino lento. Vuol dire che ti voglio bene.', 'Ti ho portato un regalo. Prego.'],
      },
      nervous: {
        all: ["Cos'era quel rumore? Non mi piace quel rumore.", 'Resta vicino a me un minuto, per favore.', "È l'aspirapolvere? Non mi fido dell'aspirapolvere."],
        dog: ['Hanno suonato! Chi è? Perché?', "Quell'ombrello si è aperto da solo. Lo tengo d'occhio."],
        cat: ['Il tappeto nuovo ha un odore strano. Sarò sotto il letto.', 'Qualcuno ha spostato la mia poltrona preferita. Niente è più sicuro.'],
      },
      sassy: {
        all: ['Scusa, mi erano stati promessi dei premietti.', 'Verrò quando ne avrò voglia.', 'Mi hai appena accarezzato contropelo?'],
        dog: ['Ti ho sentito. Scelgo di non ascoltare.', "Quello non è il mio calzino. Non l'ho mai visto prima."],
        cat: ["L'ho buttato giù dal tavolo. E lo rifarei.", 'La tua tastiera è calda. Ora è il mio letto.'],
      },
    },
    pt: {
      happy: {
        all: ['Hoje é um dia muito bom. Talvez o melhor de todos.', 'Que alegria ter você aqui!', 'Está tudo perfeito. Não mude nada.'],
        dog: ['Estou abanando o rabo tão rápido que vou decolar!', 'Você voltou! Você VOLTOU! É o melhor momento da minha vida!'],
        cat: ['Estou ronronando. Não vá se achar.', 'Eu e este raio de sol chegamos a um acordo.'],
      },
      playful: {
        all: ['Vamos brincar! Estou com muita energia agora.', 'Pega-pega! Tá com você!', 'Isso é um brinquedo? TUDO é um brinquedo?'],
        dog: ['Joga a bolinha! De novo! De novo!', 'Achei um graveto. É o melhor graveto. Pode admirar.'],
        cat: ['Mexe a cordinha. Mais rápido. MAIS RÁPIDO.', 'Vou atacar seus pés. Não diga que eu não avisei.'],
      },
      excited: {
        all: ['Está acontecendo algo incrível e eu não sei o que é!', 'Modo turbo! Liberem o corredor!', 'Não consigo parar de me mexer!'],
        dog: ['Aquilo era um esquilo? ERA UM ESQUILO? Preciso saber!', 'Alguém disse “passear”? Eu ouvi “passear”!'],
        cat: ['Corrida das três da manhã. Saiam da frente!', 'Tem um inseto na parede. É o momento mais importante da minha vida.'],
      },
      hungry: {
        all: ['Já é hora do jantar? Parece hora do jantar.', 'Meu pote está suspeitamente vazio.', 'Estou sentindo um cheiro delicioso. Vamos dividir?'],
        dog: ['Eu faria qualquer coisa por um petisquinho. Senta, rola, o que você quiser.', 'Eu me comportei muito bem. Cachorros bonzinhos ganham petiscos.'],
        cat: ['O café da manhã foi há horas. Estou definhando.', 'Dá para ver o fundo do meu pote. Isso é uma emergência.'],
      },
      sleepy: {
        all: ['Só mais cinco minutinhos. Ou cinco horas.', 'Sonhei que estava correndo atrás de algo. Quase peguei!', 'Cobertor. Quentinho. Perfeito. Boa noite.'],
        dog: ['Que passeio! Valeu a pena.', 'Me acorda se alguém abrir um pacote de salgadinho.'],
        cat: ['Só tirei onze sonecas hoje. Hora da décima segunda.', 'Não perturbe. Modo aconchego ativado.'],
      },
      curious: {
        all: ['Que cheiro é esse? Preciso investigar.', 'Opa, o que tem ali?', 'Ouvi um barulho. Preciso conferir.'],
        dog: ['Este hidrante está cheio de recados hoje.', 'Cada arbusto desta rua tem uma história para contar.'],
        cat: ['Por que esta caixa está aqui? Agora ela é minha.', 'O que tem dentro daquele armário? Abre. Pela ciência.'],
      },
      loving: {
        all: ['Você é meu humano favorito no mundo inteiro.', 'Vamos ficar agarradinhos? Só um pouquinho. Ou para sempre.', 'Com você por perto, eu me sinto em paz.'],
        dog: ['Deixa eu me encostar em você. É assim que eu abraço.', 'Eu dividiria meu brinquedo favorito com você. Provavelmente.'],
        cat: ['Estou piscando devagar para você. Isso quer dizer que eu te amo.', 'Eu trouxe um presente para você. De nada.'],
      },
      nervous: {
        all: ['Que barulho foi esse? Não gosto desse barulho.', 'Fica pertinho de mim um minuto, por favor.', 'Isso é o aspirador? Eu não confio no aspirador.'],
        dog: ['A campainha tocou! Quem é? Por quê?', 'Aquele guarda-chuva abriu sozinho. Estou de olho nele.'],
        cat: ['O tapete novo tem um cheiro estranho. Vou ficar debaixo da cama.', 'Alguém mudou minha poltrona favorita de lugar. Nada mais é seguro.'],
      },
      sassy: {
        all: ['Com licença, me prometeram petiscos.', 'Eu vou quando eu quiser.', 'Você acabou de me acariciar contra o pelo?'],
        dog: ['Eu ouvi. Só estou escolhendo não obedecer.', 'Essa meia não é minha. Nunca vi essa meia.'],
        cat: ['Eu derrubei da mesa. E faria de novo.', 'Seu teclado está quentinho. Agora é minha cama.'],
      },
    },
    ja: {
      happy: {
        all: ['今日はとってもいい日。たぶん最高の日！', 'きみがいてくれて、すごくうれしい！', 'ぜんぶ完ぺき。このままでいてね。'],
        dog: ['しっぽを振りすぎて、飛んでいっちゃいそう！', 'おかえり！おかえり！人生でいちばん幸せな瞬間だよ！'],
        cat: ['ゴロゴロ言ってるけど、調子に乗らないでね。', 'この日なたとは、もう話がついてるの。'],
      },
      playful: {
        all: ['遊ぼう！今エネルギーがありあまってるんだ！', 'タッチ！次はきみが鬼だよ！', 'それ、おもちゃ？もしかして、ぜんぶおもちゃ？'],
        dog: ['ボール投げて！もう一回！もう一回！', '棒を見つけたよ。世界一の棒。ほめてもいいよ。'],
        cat: ['ひもを振って。もっと速く。もっともっと！', '今から足の指に飛びかかるよ。予告したからね。'],
      },
      excited: {
        all: ['なにかすごいことが起きてる！なにかはわからないけど！', 'ダッシュタイム！ろうかを空けて！', 'じっとしてられない！むりむり！'],
        dog: ['今のリス？リスだった？確かめなきゃ！', '今「さんぽ」って言った？「さんぽ」って聞こえた！'],
        cat: ['夜中の3時の大運動会！どいてどいて！', 'かべに虫がいる。これは人生でいちばん大事な瞬間。'],
      },
      hungry: {
        all: ['もう晩ごはんの時間？そんな気がする。', 'お皿が、あやしいくらい空っぽなんだけど。', 'いいにおいがする。はんぶんこしよ？'],
        dog: ['おやつ一個のためなら、おすわりでもゴロンでもなんでもするよ。', 'すっごくいい子にしてたよ。いい子にはおやつだよね。'],
        cat: ['朝ごはんから何時間たったと思ってるの。やせ細っちゃう。', 'お皿の底が見えてる。これは緊急事態です。'],
      },
      sleepy: {
        all: ['あと5分。いや、あと5時間。', 'なにかを追いかける夢を見てたの。もうちょっとでつかまえられたのに！', '毛布。ぬくぬく。完ぺき。おやすみ。'],
        dog: ['いっぱい歩いたね。楽しかった。', 'だれかがお菓子の袋を開けたら起こしてね。'],
        cat: ['今日はまだ11回しか昼寝してない。12回目いきます。', '起こさないで。ぬくぬくモード中。'],
      },
      curious: {
        all: ['このにおいは何？調べなきゃ。', 'おっ、あっちには何があるの？', 'なにか音がした。見に行かなきゃ。'],
        dog: ['この消火栓、今日はメッセージがいっぱい。', 'この道のしげみには、それぞれ物語があるんだ。'],
        cat: ['なんでここに箱があるの？今日からわたしの箱。', 'あのクローゼットの中には何があるの？開けて。科学のために。'],
      },
      loving: {
        all: ['きみは世界でいちばん好きな人間だよ。', 'くっついていい？ちょっとだけ。それとも、ずっと。', 'きみがそばにいると安心する。'],
        dog: ['よりかからせて。これがハグのつもり。', 'いちばん好きなおもちゃ、きみになら貸してあげる。たぶん。'],
        cat: ['ゆっくりまばたきしてるの。大好きって意味だよ。', 'プレゼントを持ってきたよ。どういたしまして。'],
      },
      nervous: {
        all: ['今の音は何？あの音、きらい。', 'ちょっとだけ、そばにいてね。', 'あれって掃除機？掃除機は信用できない。'],
        dog: ['ピンポン鳴った！だれ？なんで？', 'あのかさ、勝手に開いた。見張っておかなきゃ。'],
        cat: ['新しいラグ、へんなにおい。ベッドの下にいるね。', 'お気に入りのいす、だれか動かした？もう何も信じられない。'],
      },
      sassy: {
        all: ['ちょっと、おやつの約束はどうなったの？', '気が向いたら行くよ。', '今、毛並みと逆になでたよね？'],
        dog: ['聞こえてたよ。聞かなかったことにするけど。', 'そのくつ下？知らないなあ。見たこともない。'],
        cat: ['テーブルから落としたよ。また落とすけど。', 'キーボードがあったかい。今日からわたしのベッド。'],
      },
    },
  };

  // Signature lines for the other species, filed under a mood and merged into the bank.
  const signature = {
    en: {
      rabbit: { happy: 'I just did a binky! Did you see? I will do another one.', hungry: "These carrots won't eat themselves. I'm helping.", sassy: "I thumped my foot. That means I'm in charge.", loving: 'Pet my ears gently. Yes, exactly like that.' },
      bird: { excited: 'I learned a new whistle! Listen! Again! Again!', happy: 'What a pretty bird! Oh wait, that is me.', playful: "I'm going to sit on your head now. Don't move.", sassy: 'I said what I said. Then I said it again, louder.' },
      hamster: { excited: 'I ran on my wheel for an hour. Went nowhere. Loved it.', hungry: 'My cheeks are full of snacks. I regret nothing.', curious: "I'm digging a secret tunnel. Don't tell anyone.", sleepy: 'It is daytime. Hamster rules say that means sleep.' },
      horse: { hungry: 'Hay is my love language.', playful: "Race you to the far fence! You'll lose.", sassy: "I'm not stubborn. I'm thinking very slowly on purpose.", loving: "Scratch my neck right there. Perfect. Don't stop." },
      turtle: { sleepy: 'Slow and steady. Mostly slow. With a nap.', curious: "I'm going over there. I'll arrive sometime tomorrow.", happy: 'Heat lamp on. Feet out. Life is good.', sassy: "No rush. I've got all the time in the world. And a shell." },
    },
    es: {
      rabbit: { happy: '¡Acabo de dar un salto de alegría! ¿Lo viste? Voy a dar otro.', hungry: 'Estas zanahorias no se van a comer solas. Yo ayudo.', sassy: 'Di un golpe con la pata. Eso significa que aquí mando yo.', loving: 'Acaríciame las orejas con cuidado. Sí, justo así.' },
      bird: { excited: '¡Aprendí un silbido nuevo! ¡Escucha! ¡Otra vez! ¡Otra vez!', happy: '¡Qué pájaro tan lindo! Ah, espera, soy yo.', playful: 'Ahora me voy a sentar en tu cabeza. No te muevas.', sassy: 'Dije lo que dije. Y luego lo repetí más fuerte.' },
      hamster: { excited: 'Corrí en mi rueda durante una hora. No llegué a ningún lado. Me encantó.', hungry: 'Tengo los cachetes llenos de comida. No me arrepiento de nada.', curious: 'Estoy cavando un túnel secreto. No se lo digas a nadie.', sleepy: 'Es de día. Según las reglas de los hámsteres, eso significa dormir.' },
      horse: { hungry: 'El heno es mi lenguaje del amor.', playful: '¡Una carrera hasta la cerca del fondo! Vas a perder.', sassy: 'No es terquedad. Estoy pensando muy despacio a propósito.', loving: 'Ráscame el cuello justo ahí. Perfecto. No pares.' },
      turtle: { sleepy: 'Despacio y sin prisa. Sobre todo sin prisa. Y con siesta.', curious: 'Voy para allá. Llegaré en algún momento de mañana.', happy: 'Lámpara de calor encendida. Patitas afuera. La vida es bella.', sassy: 'Sin prisa. Tengo todo el tiempo del mundo. Y un caparazón.' },
    },
    fr: {
      rabbit: { happy: "Je viens de faire un binky ! Tu as vu ? J'en fais un autre.", hungry: 'Ces carottes ne vont pas se manger toutes seules. Je donne un coup de main.', sassy: "J'ai tapé de la patte. Ça veut dire que c'est moi le chef.", loving: 'Caresse-moi les oreilles doucement. Oui, exactement comme ça.' },
      bird: { excited: "J'ai appris un nouveau sifflement ! Écoute ! Encore ! Encore !", happy: "Quel joli oiseau ! Ah, attends, c'est moi.", playful: 'Je vais me poser sur ta tête. Ne bouge pas.', sassy: "J'ai dit ce que j'ai dit. Puis je l'ai répété plus fort." },
      hamster: { excited: "J'ai couru une heure dans ma roue. Sans bouger d'un centimètre. J'ai adoré.", hungry: 'Mes joues sont pleines de graines. Je ne regrette rien.', curious: 'Je creuse un tunnel secret. Ne le dis à personne.', sleepy: "Il fait jour. Selon le règlement des hamsters, c'est l'heure de dormir." },
      horse: { hungry: "Le foin, c'est ma façon de dire je t'aime.", playful: "Course jusqu'à la clôture du fond ! Tu vas perdre.", sassy: "Ce n'est pas de l'entêtement. Je réfléchis très lentement, exprès.", loving: "Gratte-moi l'encolure, juste là. Parfait. N'arrête pas." },
      turtle: { sleepy: 'Lentement mais sûrement. Surtout lentement. Et avec une sieste.', curious: 'Je vais là-bas. J\'arriverai demain, à un moment.', happy: 'Lampe chauffante allumée. Pattes dehors. La vie est belle.', sassy: "Rien ne presse. J'ai tout mon temps. Et une carapace." },
    },
    de: {
      rabbit: { happy: "Ich hab gerade einen Freudensprung gemacht! Hast du's gesehen? Gleich noch einer.", hungry: 'Diese Karotten essen sich nicht von allein. Ich helfe mit.', sassy: 'Ich habe mit dem Fuß geklopft. Das heißt: Hier bestimme ich.', loving: 'Streichel sanft meine Ohren. Ja, genau so.' },
      bird: { excited: 'Ich habe einen neuen Pfiff gelernt! Hör zu! Nochmal! Nochmal!', happy: 'Was für ein hübscher Vogel! Ach, warte, das bin ich.', playful: 'Ich setze mich jetzt auf deinen Kopf. Nicht bewegen.', sassy: 'Ich habe gesagt, was ich gesagt habe. Und dann nochmal lauter.' },
      hamster: { excited: 'Ich bin eine Stunde im Laufrad gerannt. Bin nirgendwo angekommen. Herrlich.', hungry: 'Meine Backen sind voller Snacks. Ich bereue nichts.', curious: 'Ich grabe einen geheimen Tunnel. Verrat es niemandem.', sleepy: 'Es ist Tag. Laut Hamsterregeln heißt das: schlafen.' },
      horse: { hungry: 'Heu ist meine Liebessprache.', playful: 'Wettrennen bis zum hinteren Zaun! Du verlierst.', sassy: 'Ich bin nicht stur. Ich denke absichtlich sehr langsam nach.', loving: 'Kratz mich genau da am Hals. Perfekt. Nicht aufhören.' },
      turtle: { sleepy: 'Langsam, aber sicher. Vor allem langsam. Und mit Nickerchen.', curious: 'Ich gehe da rüber. Ankunft irgendwann morgen.', happy: 'Wärmelampe an. Beine raus. Das Leben ist schön.', sassy: 'Keine Eile. Ich habe alle Zeit der Welt. Und einen Panzer.' },
    },
    it: {
      rabbit: { happy: "Ho appena fatto un salto di gioia! L'hai visto? Ne faccio un altro.", hungry: 'Queste carote non si mangiano da sole. Do una mano.', sassy: 'Ho battuto la zampa. Vuol dire che qui comando io.', loving: 'Accarezzami le orecchie con delicatezza. Sì, proprio così.' },
      bird: { excited: 'Ho imparato un fischio nuovo! Ascolta! Ancora! Ancora!', happy: "Che bell'uccellino! Ah, aspetta, sono io.", playful: 'Adesso mi siedo sulla tua testa. Non muoverti.', sassy: "Ho detto quello che ho detto. Poi l'ho ripetuto più forte." },
      hamster: { excited: "Ho corso un'ora sulla mia ruota. Senza spostarmi di un millimetro. Fantastico.", hungry: 'Ho le guance piene di semi. Non mi pento di niente.', curious: 'Sto scavando un tunnel segreto. Non dirlo a nessuno.', sleepy: 'È giorno. Secondo le regole dei criceti, vuol dire nanna.' },
      horse: { hungry: "Il fieno è il mio linguaggio dell'amore.", playful: 'Gara fino alla staccionata in fondo! Perderai.', sassy: 'Non è testardaggine. Sto pensando molto lentamente, apposta.', loving: 'Grattami il collo proprio lì. Perfetto. Non smettere.' },
      turtle: { sleepy: 'Piano piano. Soprattutto piano. E con un pisolino.', curious: 'Vado laggiù. Arriverò domani, prima o poi.', happy: 'Lampada riscaldante accesa. Zampe fuori. La vita è bella.', sassy: 'Nessuna fretta. Ho tutto il tempo del mondo. E un guscio.' },
    },
    pt: {
      rabbit: { happy: 'Acabei de dar um pulinho de alegria! Você viu? Vou dar outro.', hungry: 'Essas cenouras não vão se comer sozinhas. Eu ajudo.', sassy: 'Bati a pata no chão. Isso quer dizer que quem manda aqui sou eu.', loving: 'Faz carinho nas minhas orelhas com cuidado. Isso, assim mesmo.' },
      bird: { excited: 'Aprendi um assobio novo! Escuta! De novo! De novo!', happy: 'Que passarinho lindo! Ah, espera, sou eu.', playful: 'Agora vou sentar na sua cabeça. Não se mexe.', sassy: 'Eu disse o que disse. Depois repeti mais alto.' },
      hamster: { excited: 'Corri uma hora na minha rodinha. Não saí do lugar. Amei.', hungry: 'Minhas bochechas estão cheias de petiscos. Não me arrependo de nada.', curious: 'Estou cavando um túnel secreto. Não conta para ninguém.', sleepy: 'É de dia. Pelas regras dos hamsters, isso significa dormir.' },
      horse: { hungry: 'Feno é a minha linguagem do amor.', playful: 'Corrida até a cerca do fundo! Você vai perder.', sassy: 'Não é teimosia. Estou pensando bem devagar, de propósito.', loving: 'Coça meu pescoço bem aí. Perfeito. Não para.' },
      turtle: { sleepy: 'Devagar e sempre. Mais devagar do que sempre. E com soneca.', curious: 'Vou ali. Chego amanhã, em algum momento.', happy: 'Lâmpada de aquecimento ligada. Patinhas para fora. A vida é boa.', sassy: 'Sem pressa. Tenho todo o tempo do mundo. E um casco.' },
    },
    ja: {
      rabbit: { happy: 'いまジャンプしちゃった！見た？もう一回やるね。', hungry: 'このにんじん、勝手には減らないからね。手伝ってあげる。', sassy: '足でダンってしたよ。ここではわたしがボスって意味。', loving: '耳をやさしくなでて。そう、そんな感じ。' },
      bird: { excited: '新しい口笛をおぼえたよ！聞いて！もう一回！もう一回！', happy: 'なんてかわいい鳥！あ、待って、わたしだった。', playful: 'いまからきみの頭にとまるね。動かないで。', sassy: '言ったことは言ったこと。それからもっと大きな声でもう一回言ったよ。' },
      hamster: { excited: '回し車で1時間走ったよ。一歩も進んでないけど、最高だった。', hungry: 'ほっぺがおやつでパンパン。後悔はしてない。', curious: 'ひみつのトンネルをほってるの。だれにも言わないでね。', sleepy: 'いまは昼間。ハムスターのルールでは、寝る時間ってこと。' },
      horse: { hungry: '干し草は、わたしの愛の言葉。', playful: '奥のさくまで競走だ！きみの負けだよ。', sassy: 'がんこなんじゃないよ。わざとすごくゆっくり考えてるの。', loving: '首のそこをかいて。完ぺき。やめないで。' },
      turtle: { sleepy: 'ゆっくり着実に。とくにゆっくり。お昼寝つきで。', curious: 'あっちに行くね。明日のどこかで着く予定。', happy: 'ヒーターオン。足を出して。人生っていいね。', sassy: '急がない、急がない。時間はたっぷりあるし、甲羅もある。' },
    },
  };
  for (const lang of Object.keys(signature)) {
    for (const species of Object.keys(signature[lang])) {
      for (const [mood, line] of Object.entries(signature[lang][species])) bank[lang][mood][species] = [line];
    }
  }

  // French typography: no-break space before ! ? : ; and inside « ».
  for (const mood of Object.keys(bank.fr)) {
    for (const group of Object.keys(bank.fr[mood])) {
      bank.fr[mood][group] = bank.fr[mood][group].map((s) =>
        s.replace(/ ([!?:;»])/g, ' $1').replace(/« /g, '« '));
    }
  }

  // Line spoken by the "Test speaker" button.
  const speakerTest = {
    en: "Hello! This is your pet's voice box. Testing, one, two, three.",
    es: '¡Hola! Soy la caja de voz de tu mascota. Probando, uno, dos, tres.',
    fr: 'Bonjour ! Ici la boîte vocale de ton animal. Test, un, deux, trois.',
    de: 'Hallo! Hier spricht die Sprachbox deines Haustiers. Test, eins, zwei, drei.',
    it: 'Ciao! Sono la voce del tuo animale. Prova, uno, due, tre.',
    pt: 'Olá! Aqui é a caixa de voz do seu pet. Testando, um, dois, três.',
    ja: 'こんにちは！ペットのボイスボックスです。テスト、いち、に、さん。',
  };

  // What the collar "heard" before translating. Shown as text only, never spoken.
  const sounds = {
    dog: {
      happy: ['Woof! Woof!', '*happy panting*', 'Arf!'],
      playful: ['Ruff ruff!', '*play bow* Woof!', 'Arf arf arf!'],
      excited: ['WOOF WOOF WOOF!', 'Awoo!', '*spins in a circle* Arf!'],
      hungry: ['*whine* Woof?', '*stares at bowl*', 'Wuff.'],
      sleepy: ['*sleepy grumble*', '*soft snore*', 'Wuff…'],
      curious: ['*sniff sniff*', 'Rrruff?', '*head tilt* Woof?'],
      loving: ['*soft whine*', '*nuzzle* Mmrf.', '*tail thump thump*'],
      nervous: ['*low whimper*', 'Ruh-roo?', '*ears back* Wuf.'],
      sassy: ['*dramatic sigh*', 'Hrrmph. Woof.', '*side-eye* Arf.'],
    },
    cat: {
      happy: ['Purrrrr…', 'Mrrp!', '*slow blink*'],
      playful: ['Mrrrow!', '*wiggle wiggle* Mew!', 'Prrrt!'],
      excited: ['MRRRAOW!', '*chatters at the window*', 'Mew mew mew!'],
      hungry: ['Meeeoooow.', 'Mew? MEW.', '*stares at bowl*'],
      sleepy: ['*tiny yawn* mew…', 'Purr… zzz', '*kneads blanket*'],
      curious: ['Mrrp?', '*whiskers forward* Mew?', 'Prrrp?'],
      loving: ['Purrrrrrr…', '*head bonk* Mrrp.', '*slow blink*'],
      nervous: ['*low meow*', 'Mew…?', '*tail puffs up*'],
      sassy: ['Mrow.', '*flicks tail* Meow.', 'Hmph. Mew.'],
    },
    rabbit: {
      happy: ['*binky!*', '*soft teeth purr*'],
      playful: ['*zoomies around the yard*', '*hop hop*'],
      excited: ['*double binky!*', '*thump thump*'],
      hungry: ['*nose wiggles at the fridge*', '*crunch crunch*'],
      sleepy: ['*flops over*', '*tiny sigh*'],
      curious: ['*nose twitch*', '*ears up*'],
      loving: ['*nose boop*', '*soft teeth purr*'],
      nervous: ['*THUMP*', '*freezes*'],
      sassy: ['*thump*', '*turns its back on you*'],
    },
    bird: {
      happy: ['Tweet tweet!', '*cheerful whistle*'],
      playful: ['*bobs head*', 'Peekaboo!'],
      excited: ['SQUAWK!', '*whistles a tune*'],
      hungry: ['*rattles seed bowl*', 'Cracker? Cracker!'],
      sleepy: ['*fluffs up*', '*tiny chirp*'],
      curious: ['*head tilt* Chirp?', '*peeks out*'],
      loving: ['*preens your hair*', '*soft chatter*'],
      nervous: ['*alarm chirp*', '*feathers flat*'],
      sassy: ['*dramatic squawk*', 'Hmph. Tweet.'],
    },
    hamster: {
      happy: ['*happy squeak*', '*wheel squeak*'],
      playful: ['*rolls in a ball*', '*squeak squeak*'],
      excited: ['*wheel spinning fast*', 'SQUEAK!'],
      hungry: ['*stuffs cheeks*', '*nibble nibble*'],
      sleepy: ['*curls up in bedding*', '*tiny yawn*'],
      curious: ['*whiskers twitch*', '*sniff sniff*'],
      loving: ['*climbs onto your hand*', '*soft squeak*'],
      nervous: ['*freezes*', '*tiny squeak?*'],
      sassy: ['*turns away*', '*kicks bedding*'],
    },
    horse: {
      happy: ['Neigh!', '*happy nicker*'],
      playful: ['*bucks playfully*', '*prances*'],
      excited: ['*whinny!*', '*snort snort*'],
      hungry: ['*stares at the hay*', '*impatient hoof paw*'],
      sleepy: ['*sleepy snort*', '*rests a hoof*'],
      curious: ['*ears forward*', '*sniffs the air*'],
      loving: ['*soft nicker*', '*nudges your shoulder*'],
      nervous: ['*snort!*', '*ears back*'],
      sassy: ['*flicks tail*', '*long sigh through the nostrils*'],
    },
    turtle: {
      happy: ['*slow blink*', '*stretches neck*'],
      playful: ['*slowly pushes a strawberry*', '*tiny splash*'],
      excited: ['*walks slightly faster*', '*neck all the way out*'],
      hungry: ['*stares at the lettuce*', '*crunch*'],
      sleepy: ['*pulls into shell*', '*very slow blink*'],
      curious: ['*peeks out of shell*', '*slow head turn*'],
      loving: ['*rests head on your finger*', '*slow blink*'],
      nervous: ['*hides in shell*', '*tiny hiss*'],
      sassy: ['*turns around very slowly*', '*hiss.*'],
    },
  };

  Paw.phrases = { bank, speakerTest, sounds };
})();
