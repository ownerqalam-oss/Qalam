"use client";

import { FeedErrorBoundary } from "../../components/FeedErrorBoundary";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) { return <FeedErrorBoundary error={error} retry={retry} title="Following feed unavailable" />; }
