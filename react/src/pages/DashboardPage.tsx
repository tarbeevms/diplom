import { useEffect, useState } from "react";
import { getDashboard } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const auth = useAuth();
  const token = auth?.token;
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (token) {
      getDashboard(token).then(setStats).catch(console.error);
    }
  }, [token]);

  if (!stats) return null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardContent className="p-6 space-y-2">
          <h3 className="font-semibold">Solved Problems</h3>
          <p className="text-3xl font-bold">{stats.solvedCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Language Usage</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.languages}>
              <XAxis dataKey="language" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}