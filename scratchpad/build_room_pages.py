"""Build standalone house pages from the overview's shared room information.
Run after changing accommodation.html or scratchpad/room-panels.html: python3 scratchpad/build_room_pages.py
Booking dialogs remain in book.html; keep their information in sync too.
"""
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parent.parent
source = (ROOT / 'accommodation.html').read_text()
panel_source = (ROOT / 'scratchpad/room-panels.html').read_text()
header = source[:source.index('<a class="room-jump"')]
footer = source[source.index('<footer class="footer">'):]
original_description = re.search(r'<meta name="description" content="([^"]+)"', header)[1]
rooms = {
 'bali-house': ('Bali House', 'A 46 m² bungalow for two, with garden, partial sea and sea views. Compare beds, breakfast and starting rates at Koh Kood Beach Resort.'),
 'bali-deluxe': ('Bali Deluxe', 'A 63 m² bungalow with a king bed, two single beds and breakfast for four at Koh Kood Beach Resort.'),
 'thai-twin-house': ('Thai Twin House', 'Two rooms, a shared terrace and jacuzzi at Koh Kood Beach Resort. Explore Thai Twin House views, beds and starting rates.'),
}
def room_nav(current):
 items={'bali-house':'Bali House','bali-deluxe':'Bali Deluxe','thai-twin-house':'Thai Twin House','sunset-house':'Sunset House · Renovation'}
 links=''.join('<a href="'+key+'.html"'+(' aria-current="page"' if key==current else '')+'>'+label+'</a>' for key,label in items.items())
 return '<nav class="room-nav" aria-label="Choose a house">'+links+'</nav>'
def page_head(key, name, description):
 return header.replace('<body>', '<body class="room-document">').replace('Accommodation — Koh Kood Beach Resort', name + ' — Koh Kood Beach Resort').replace(original_description, description).replace('https://kohkoodbeach.com/accommodation.html', 'https://kohkoodbeach.com/' + key + '.html')
for key, (name, description) in rooms.items():
 start=panel_source.index(f'<div class="panel" id="panel-{key}"')
 depth=0
 for match in re.finditer(r'<div\b|</div>',panel_source[start:]):
  depth += 1 if match[0]=='<div' else -1
  if depth==0:
   panel=panel_source[start:start+match.end()];break
 panel=panel.replace(f' data-panel="{key}" hidden','')
 card=re.search(r'<article class="cat" id="'+key+r'">(.*?)</article>',source,re.S)[1]
 facts=re.search(r'<dl class="cat__facts">.*?</dl>',card,re.S)[0]
 panel=panel.replace('<h4 class="pick__h">','<h2 class="pick__h">').replace('</h4>','</h2>')
 panel=panel.replace('<h5 class="extras__h">','<h3 class="extras__h">').replace('</h5>','</h3>')
 if key=='bali-deluxe':
  panel=panel.replace('Choose your view','Your room and rate')
  panel=re.sub(r'<p class="pick__int">.*?</p>','<p class="pick__int">Partial sea view, with two bedrooms and breakfast for four.</p>',panel,flags=re.S)
 # Give legacy variant redirects an exact, visible destination.
 panel=re.sub(r'<div class="pick">(.*?)</div>', lambda m: '<div class="pick" id="'+re.search(r'book.html\?room=([a-z-]+)',m[1])[1]+'">'+m[1]+'</div>', panel, flags=re.S)
 panel=panel.replace('>Book now</a>','>Enquire about this room</a>')
 panel=panel.replace('<span class="pick__unit">THB</span>','<span class="pick__unit">THB / night</span>')
 body=f'''<main class="room-page"><div class="wrap">
 <p><a href="accommodation.html#compare-rooms">← All rooms</a></p>
 {room_nav(key)}
 <p class="label">Koh Kood Beach Resort · Accommodation</p><h1>{name}</h1>
 {facts}
 {panel}
 <p class="room-page__next">Need help deciding? <a href="contact.html">Ask us about your stay</a> or <a href="getting-here.html">plan your journey to Koh Kood</a>.</p>
 </div></main>'''
 (ROOT/(key+'.html')).write_text(page_head(key,name,description)+body+footer)
key='sunset-house';name='Sunset House'
description='Sunset House at Koh Kood Beach Resort is currently under renovation and cannot be booked. Explore our other bungalows for your stay.'
body=f'''<main class="room-page"><div class="wrap-narrow">
 <p><a href="accommodation.html#compare-rooms">← All rooms</a></p>
 {room_nav(key)}
 <p class="label">Koh Kood Beach Resort · Accommodation</p><h1>Sunset House</h1>
 <aside class="renovation-notice" aria-labelledby="renovation-title"><h2 id="renovation-title">Currently under renovation</h2><p>Sunset House cannot be booked at this time. We have not announced a reopening date. Please choose one of our available bungalow styles for your stay.</p><a class="btn" href="accommodation.html#compare-rooms">Explore available rooms</a></aside>
 <h2>A house with a sea view</h2>
 <p>Before renovation, Sunset Upper offered two individual bedrooms opening onto a shared terrace, with a shared jacuzzi and views towards the sea. It was designed for families or friends staying together.</p>
 <p>The previous layout included a king bed and a double bed, open-air bathrooms, air conditioning, a television, tea and coffee facilities, and a minibar. The description here refers to the house before renovation; the final layout and facilities will be confirmed when it reopens.</p>
 <h2>Planning a stay in the meantime?</h2><p>Explore <a href="bali-deluxe.html">Bali Deluxe</a> for a king bed and two singles, or <a href="thai-twin-house.html">Thai Twin House</a> for two rooms with a shared terrace and jacuzzi.</p>
 <p>For questions about Sunset House, <a href="contact.html">contact our team</a>. We are not accepting Sunset House reservations during renovation.</p>
 </div></main>'''
(ROOT/(key+'.html')).write_text(page_head(key,name,description)+body+footer)
