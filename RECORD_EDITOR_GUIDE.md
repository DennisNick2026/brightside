# Brightside Record Editor Guide

You can control how a Brightside archive record behaves by editing its JSON file in `records/`.

## The important field

The `status` field controls the visible state of the record.

### PUBLIC

```json
"status": "PUBLIC"
```

The record opens normally and its body is visible.

### RESTRICTED

```json
"status": "RESTRICTED",
"key": "PLANCK"
```

The record shows an access prompt. Players must enter the value in `key` to see the body.

To change the key, just edit the value:

```json
"key": "NEWKEY"
```

To remove the lock, remove the `key` line and set the status back to PUBLIC:

```json
"status": "PUBLIC"
```

### CLASSIFIED

```json
"status": "CLASSIFIED",
"key": "SOMEKEY"
```

This currently behaves like a keyed restricted record, but lets the archive display a different classification label.

### WITHDRAWN

```json
"status": "WITHDRAWN"
```

The record can still be found if someone knows its reference, but the document itself is not displayed. Players see a withdrawal notice instead.

### CORRUPTED

```json
"status": "CORRUPTED"
```

The record opens, but Brightside displays a warning that the archive copy is incomplete before showing the available body text.

## A simple GM workflow

You can prepare a record in advance and change only its status during the game.

For example, change:

```json
"status": "WITHDRAWN"
```

Later change it to:

```json
"status": "PUBLIC"
```

Commit the change in GitHub and the archive will use the new state once GitHub Pages has updated.

## Other fields you can safely edit

- `title` = document title
- `category` = archive category
- `date` = in-universe date
- `source` = organisation/source
- `summary` = text shown on the lookup result
- `body` = actual document
- `key` = access key
- `related` = links to other known records

Keep the JSON punctuation intact. If you are only changing a value inside quotation marks, you generally cannot break the file.

## Related records

A record can point players towards another record:

```json
"related": [
  {
    "id": "VRA-325-1002",
    "label": "Related Transfer Register"
  }
]
```

Players will see this as a clickable link at the bottom of the record.

## Important

The access key is an ARG mechanic, not real security. Anyone who inspects the public website files can technically see it. That is intentional for Brightside.