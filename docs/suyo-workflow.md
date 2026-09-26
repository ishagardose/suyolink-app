# Suyo request workflow

Decision: providers apply; the requester approves exactly one provider. Users can be requesters on one request and providers on another; no permanent role selection is required.

## Statuses and ownership
- Open: a requester posts a request. Other users may apply before its deadline. Applying does not assign the task.
- Assigned: the requester approves one applicant. Other applications close. Users cannot apply to their own request.
- In progress: only the assigned provider can start the task.
- Awaiting confirmation: the assigned provider submits proof.
- Completed: only the requester confirms completion. This later triggers history, rating eligibility, and a once-only points award.
- Cancelled: the requester may cancel an Open request. Cancellation after assignment needs a separate policy before implementation.

A rejected application leaves the request Open. A rejected proof returns the task to In progress with a requester explanation. An expired Open request must stop accepting applications; passing a deadline never implies completion. Automatic confirmation, disputes, and payment processing are not included.

## Implemented in this stage
Post a Suyo validates and stores title, details, category, offer in integer centavos, future deadline, location, optional notes, requester snapshot, timestamps, and Open status. Dashboard cards render saved requests. The board is shared within this device/browser and survives logout; it starts empty. Reload failure blocks posting to avoid overwriting unread data.

The deadline is entered in device-local time and stored as ISO UTC. Location is text, not GPS. Offers are recorded promises, not collected payments. Local mock email identifies the requester for now; real authentication must replace it with an immutable user ID before multi-user use.

## Later stages
Applications, approval/rejection, status transitions, proof upload, confirmation, ratings, notifications, and points are defined above but not implemented here. No assigned/in-progress request is fabricated for display.
