# Security Spec - Subscribers

## Data Invariants
- A subscriber must have a valid email format.
- A subscriber must have a `createdAt` timestamp matching `request.time`.
- Subscribers can only be created. No reading, updating, or deleting from the client.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to create a subscriber with a fake `ownerId` (not applicable here as it's public submission).
2. **Resource Poisoning**: Inject a 1MB string into the email field.
3. **Identity Poisoning**: Use a massive junk string for the document ID.
4. **State Shortcutting**: Bypass the `createdAt` server timestamp requirement.
5. **Unauthorized Read**: Attempt to list all subscribers.
6. **Unauthorized Delete**: Attempt to delete a subscriber record.
7. **Unauthorized Update**: Attempt to change a subscriber's email after submission.
8. **Shadow Update**: Include extra fields like `isVerified: true`.
9. **Email Spoofing**: Submit an email that doesn't match a valid format.
10. **Type Mismatch**: Submit `createdAt` as a string instead of a timestamp.
11. **ID Collision**: Attempt to overwrite an existing subscriber (though we'll use `addDoc` which generates IDs, but still).
12. **Malicious ID Pattern**: Use a document ID that includes path traversal characters.

## Test Runner (TDD)
I will implement rules that deny all these.
