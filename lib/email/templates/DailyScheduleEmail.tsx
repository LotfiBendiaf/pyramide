// import {
//   Body,
//   Container,
//   Head,
//   Heading,
//   Hr,
//   Html,
//   Preview,
//   Section,
//   Text,
//   Row,
//   Column,
// } from "@react-email/components";
// import { DailyScheduleData, ScheduleItem } from "../emailService";

// const main = {
//   backgroundColor: "#f6f9fc",
//   fontFamily:
//     '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
// };

// const container = {
//   backgroundColor: "#ffffff",
//   margin: "0 auto",
//   padding: "20px 0 48px",
//   marginBottom: "64px",
//   borderRadius: "8px",
// };

// const heading = {
//   fontSize: "24px",
//   letterSpacing: "-0.5px",
//   lineHeight: "1.3",
//   fontWeight: "600",
//   color: "#1a1a1a",
//   padding: "17px 0 0",
// };

// const subheading = {
//   fontSize: "14px",
//   color: "#666666",
//   margin: "0 0 20px",
// };

// const statsContainer = {
//   backgroundColor: "#f8fafc",
//   borderRadius: "8px",
//   padding: "16px",
//   marginBottom: "24px",
// };

// const statBox = {
//   textAlign: "center" as const,
//   padding: "8px",
// };

// const statValue = {
//   fontSize: "24px",
//   fontWeight: "700",
//   color: "#1a56db",
//   margin: "0",
// };

// const statLabel = {
//   fontSize: "12px",
//   color: "#666666",
//   margin: "4px 0 0",
// };

// const scheduleItem = {
//   backgroundColor: "#ffffff",
//   border: "1px solid #e5e7eb",
//   borderRadius: "8px",
//   padding: "12px 16px",
//   marginBottom: "12px",
// };

// const itemTime = {
//   fontSize: "14px",
//   fontWeight: "600",
//   color: "#1a56db",
//   margin: "0 0 4px",
// };

// const itemTitle = {
//   fontSize: "16px",
//   fontWeight: "500",
//   color: "#1a1a1a",
//   margin: "0 0 4px",
// };

// const itemDetails = {
//   fontSize: "13px",
//   color: "#666666",
//   margin: "0",
// };

// const badge = {
//   display: "inline-block",
//   fontSize: "11px",
//   fontWeight: "500",
//   padding: "2px 8px",
//   borderRadius: "4px",
//   marginRight: "8px",
// };

// const badgeColors: Record<string, { backgroundColor: string; color: string }> =
//   {
//     followup: { backgroundColor: "#dbeafe", color: "#1e40af" },
//     task: { backgroundColor: "#fef3c7", color: "#92400e" },
//     event: { backgroundColor: "#d1fae5", color: "#065f46" },
//   };

// const footer = {
//   fontSize: "12px",
//   color: "#8898aa",
//   marginTop: "32px",
//   textAlign: "center" as const,
// };

// function getTypeLabel(type: string): string {
//   const labels: Record<string, string> = {
//     followup: "Suivi",
//     task: "Tâche",
//     event: "Événement",
//   };
//   return labels[type] || type;
// }

// function getChannelLabel(channel?: string): string {
//   if (!channel) return "";
//   const labels: Record<string, string> = {
//     CALL: "Appel",
//     WHATSAPP: "WhatsApp",
//     EMAIL: "Email",
//     VISIT: "Visite",
//   };
//   return labels[channel] || channel;
// }

// export default function DailyScheduleEmail({
//   agentName,
//   date,
//   items,
//   stats,
// }: DailyScheduleData) {
//   return (
//     <Html>
//       <Head />
//       <Preview>
//         Votre planning du {date} - {stats.totalItems.toFixed()} éléments
//       </Preview>
//       <Body style={main}>
//         <Container style={container}>
//           <Section style={{ padding: "0 24px" }}>
//             <Heading style={heading}>Bonjour {agentName} 👋</Heading>
//             <Text style={subheading}>Voici votre planning pour le {date}</Text>

//             {/* Stats */}
//             <Section style={statsContainer}>
//               <Row>
//                 <Column style={statBox}>
//                   <Text style={statValue}>{stats.totalItems}</Text>
//                   <Text style={statLabel}>Total</Text>
//                 </Column>
//                 <Column style={statBox}>
//                   <Text style={statValue}>{stats.visits}</Text>
//                   <Text style={statLabel}>Visites</Text>
//                 </Column>
//                 <Column style={statBox}>
//                   <Text style={statValue}>{stats.calls}</Text>
//                   <Text style={statLabel}>Appels</Text>
//                 </Column>
//                 <Column style={statBox}>
//                   <Text style={statValue}>{stats.tasks}</Text>
//                   <Text style={statLabel}>Tâches</Text>
//                 </Column>
//               </Row>
//             </Section>

//             <Hr style={{ borderColor: "#e5e7eb", margin: "20px 0" }} />

//             {/* Schedule Items */}
//             {items.length === 0 ? (
//               <Text style={{ textAlign: "center", color: "#666666" }}>
//                 Aucun élément prévu pour aujourd&apos;hui
//               </Text>
//             ) : (
//               items.map((item: ScheduleItem) => (
//                 <Section key={item.id} style={scheduleItem}>
//                   <Text style={itemTime}>{item.time}</Text>
//                   <Text style={itemTitle}>
//                     <span
//                       style={{
//                         ...badge,
//                         ...badgeColors[item.type],
//                       }}
//                     >
//                       {getTypeLabel(item.type)}
//                     </span>
//                     {item.channel && (
//                       <span
//                         style={{
//                           ...badge,
//                           backgroundColor: "#f3f4f6",
//                           color: "#374151",
//                         }}
//                       >
//                         {getChannelLabel(item.channel)}
//                       </span>
//                     )}
//                     {item.title}
//                   </Text>
//                   <Text style={itemDetails}>
//                     {item.clientName && `Client: ${item.clientName}`}
//                     {item.listingTitle && ` • Bien: ${item.listingTitle}`}
//                     {item.location && ` • ${item.location}`}
//                     {item.priority && ` • Priorité: ${item.priority}`}
//                   </Text>
//                 </Section>
//               ))
//             )}

//             <Hr style={{ borderColor: "#e5e7eb", margin: "20px 0" }} />

//             <Text style={footer}>
//               Pyramide Immobilier
//               <br />
//               Cet email a été envoyé automatiquement. Ne pas répondre.
//             </Text>
//           </Section>
//         </Container>
//       </Body>
//     </Html>
//   );
// }
