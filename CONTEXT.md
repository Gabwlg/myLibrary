# myLibrary — Domain Context

myLibrary tracks a person's personal media collection (movies, books, and an
open-ended "other" type) in one visual dashboard. Each person sees only their
own collection.

## Glossary

### Item
A single entry in a person's collection: a movie, a book, or something of type
"other". An Item carries shared fields (title, creator, year, cover image,
status, rating, tags, notes) and, for movies and books, a small set of
type-specific fields held in a companion record.

### Status
Where an Item sits in its lifecycle. The available values depend on the Item's
type: a movie moves through "to watch" → "watching" → "watched"; a book through
"to read" → "reading" → "read"; an "other" item through "planned" → "completed".
An Item has exactly one current Status, and it is always the destination of the
Item's most recent Progress event — Status is not set directly, it is a readable
reflection of the Item's activity history.

### Terminal status
The final Status in a type's lifecycle — "watched" for movies, "read" for books,
"completed" for other. Reaching a Terminal status is what it means for an Item to
be **finished**.

### Progress event
A recorded moment in an Item's lifecycle, forming that Item's activity history —
and the source of truth for the Item's current Status. In v1 the only kind of
Progress event is a **status transition**: a record that the Item's Status
changed from one value to another (or, for a newly added Item, from no prior
Status), together with when the change happened. The event that marks an Item as
finished is a status transition whose new Status is the type's Terminal status.

The name "progress log" is used informally for the whole collection of Progress
events belonging to an Item, or to the collection as a whole.

### Backfill
A one-time synthesis of Progress events for Items that already existed before the
progress log was introduced. Because no real history was captured for those
Items, the Backfill derives a single status transition per Item from its current
Status and its creation time.

### Demo mode
The app's behaviour when no Supabase credentials are configured: it runs entirely
in the browser off a fixed set of sample Items, and nothing the person changes is
persisted across a page reload. In Demo mode the progress log is derived fresh on
each load rather than stored.
