// src/PdfDTR.jsx
import React from 'react';
import { X, Printer } from 'lucide-react';
import {
  PDFViewer,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// 1. Register the exact Times New Roman fonts
Font.register({
  family: 'Times New Roman', 
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times New Roman.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman-bold@1.0.4/Times New Roman Bold.ttf', fontWeight: 'bold' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman-italic@1.0.4/Times New Roman Italic.ttf', fontStyle: 'italic' }
  ]
});

// 2. Exact Styles with STRICT Borders
const styles = StyleSheet.create({
  page: {
    fontFamily: "Times New Roman",
    flexDirection: "column",
  },
  section: {
    margin: 0,
    paddingHorizontal: 15,
    paddingVertical: 5,
    flexGrow: 1,
  },
  tableBorderHeader1: {
    margin: 0,
    borderWidth: 1.5,
    borderColor: '#000',
    borderStyle: 'solid',
    borderLeftWidth: 0,
    width: "100%",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "bold",
    padding: 0,
  },
  tableBorderHeader2: {
    borderWidth: 1.5,
    borderColor: '#000',
    borderStyle: 'solid',
    borderLeftWidth: 0,
    margin: 0,
    fontSize: 11,
    textAlign: "center",
    fontWeight: "bold",
    minWidth: "50%",
    width: "50%",
  },
});

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const getDayCounts = (year, monthIndex) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  let saturdayCount = 0;
  let sundayCount = 0;
  let regularDayCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = new Date(year, monthIndex, day).getDay();

    if (dayOfWeek === 0) {
      sundayCount++;
    } else if (dayOfWeek === 6) {
      saturdayCount++;
    } else {
      regularDayCount++;
    }
  }

  return { saturdayCount, sundayCount, regularDayCount, daysInMonth };
};

export default function PdfDTR({ isOpen, onClose, employee, month, year, dtrRecords }) {
  if (!isOpen || !employee) return null;

  const lastName = (employee.Surname || employee.surname || '').toUpperCase();
  const firstName = (employee.FirstName || employee.firstname || '').toUpperCase();
  const middleName = (employee.MiddleName || employee.middlename || '').toUpperCase();
  const fullName = `${lastName}, ${firstName} ${middleName}`.trim();
  const empId = employee.EmployeeId || employee.employeeId || '';

  const monthIndex = MONTHS.indexOf(month);
  const { saturdayCount, regularDayCount, daysInMonth } = getDayCounts(parseInt(year), monthIndex);

  // ========================================================
  // THE BRAIN: Timezone-Immune Math & Seconds Format Engine
  // ========================================================
  const generateDtrData = () => {
    const safeDtrRecords = Array.isArray(dtrRecords) ? dtrRecords : (dtrRecords?.data || dtrRecords?.records || []);
    
    const paddedMonth = (monthIndex + 1).toString().padStart(2, '0');
    const yearMonthTarget = `${year}-${paddedMonth}`; 
    const targetBioId = String(employee.BioId || employee.biometricId || employee.bioId || '');

    const formatTime = (val) => {
      if (!val || val === 'null' || val === 'undefined') return '';
      const str = String(val).trim();
      if (str.includes('T')) return str.split('T')[1].substring(0, 8); 
      const match = str.match(/\b\d{2}:\d{2}:\d{2}\b/);
      if (match) return match[0];
      
      const shortMatch = str.match(/\b\d{2}:\d{2}\b/);
      return shortMatch ? `${shortMatch[0]}:00` : str;
    };

    const calculateMinutes = (timeIn, timeOut) => {
      if (!timeIn || !timeOut) return 0;
      const [inH, inM] = timeIn.split(':').map(Number);
      const [outH, outM] = timeOut.split(':').map(Number);
      const totalIn = (inH * 60) + inM;
      const totalOut = (outH * 60) + outM;
      return totalOut > totalIn ? (totalOut - totalIn) : 0;
    };

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const paddedDay = day.toString().padStart(2, '0');
      
      const exactDateTarget = `${yearMonthTarget}-${paddedDay}`;
      const slashTarget = `${year}/${paddedMonth}/${paddedDay}`;
      const alternateSlashTarget = `${paddedMonth}/${paddedDay}/${year}`;

      if (safeDtrRecords.length === 0) {
        return { dateId: day, timeInAM: '', timeOutAM: '', timeInPM: '', timeOutPM: '', hours: '', minutes: '', rawMinutes: 0 };
      }

      const dayRecord = safeDtrRecords.find(dtr => {
        const dbBioId = String(dtr.biometricsNo_fk || dtr.biometricId || dtr.userId || dtr.user_id || '');
        if (dbBioId !== targetBioId && dbBioId !== String(empId)) return false;

        const rawDate = dtr.dtrDate || dtr.date || dtr.dateLog;
        if (!rawDate) return false;

        const dateStr = String(rawDate).trim();
        return dateStr.includes(exactDateTarget) || dateStr.includes(slashTarget) || dateStr.includes(alternateSlashTarget);
      });

      if (dayRecord) {
        const amIn = formatTime(dayRecord.timeInAM || dayRecord.timeInAm || dayRecord.time_in_am);
        const amOut = formatTime(dayRecord.timeOutAM || dayRecord.timeOutAm || dayRecord.time_out_am);
        const pmIn = formatTime(dayRecord.timeInPM || dayRecord.timeInPm || dayRecord.time_in_pm);
        const pmOut = formatTime(dayRecord.timeOutPM || dayRecord.timeOutPm || dayRecord.time_out_pm);

        const dailyMinutes = calculateMinutes(amIn, amOut) + calculateMinutes(pmIn, pmOut);

        return {
          dateId: day,
          timeInAM: amIn,
          timeOutAM: amOut,
          timeInPM: pmIn,
          timeOutPM: pmOut,
          hours: dailyMinutes > 0 ? String(Math.floor(dailyMinutes / 60)) : '',
          minutes: dailyMinutes > 0 ? String(dailyMinutes % 60) : '',
          rawMinutes: dailyMinutes
        };
      }

      return { dateId: day, timeInAM: '', timeOutAM: '', timeInPM: '', timeOutPM: '', hours: '', minutes: '', rawMinutes: 0 };
    });
  };

  const processedData = generateDtrData();

  const grandTotalMinutes = processedData.reduce((acc, curr) => acc + (curr.rawMinutes || 0), 0);
  const grandHours = grandTotalMinutes > 0 ? String(Math.floor(grandTotalMinutes / 60)) : '';
  const grandMinutes = grandTotalMinutes > 0 ? String(grandTotalMinutes % 60) : '';

  const DTRDocument = () => (
    <Document>
      <Page size={{ height: 16 * 72, width: 8 * 72 }} style={styles.page}>
        <View style={styles.section}>
          
          <View style={{ width: "100%", borderBottomWidth: 1, borderBottomColor: '#000', borderBottomStyle: 'solid', paddingBottom: 2, marginBottom: 5 }}>
            <Text style={{ fontSize: 15, marginBottom: 10 }}>CIVIL SERVICE FORM No.48</Text>

            <View>
              <View>
                <Text style={{ alignSelf: "center", marginBottom: 5, fontSize: 18 }}>DAILY TIME RECORD</Text>
              </View>
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', borderBottomStyle: 'solid', flexDirection: "row", width: "100%" }}>
                <View style={{ width: "100%" }}>
                  {/* ✅ FIXED: Changed extrabold to standard registered bold */}
                  <Text style={{ alignSelf: "stretch", textAlign: "center", fontWeight: "bold", fontSize: 18 }}>
                    {fullName}
                  </Text>
                </View>
              </View>
              <View>
                <View style={{ position: "absolute" }}>
                  <Text style={{ alignSelf: "flex-end", fontStyle: "italic", fontSize: 14 }}>{empId}</Text>
                </View>
                <Text style={{ alignSelf: "center", fontSize: 14, fontStyle: "italic" }}>(Name)</Text>
              </View>
            </View>

            <View style={{ width: "100%", flexDirection: "row", alignItems: "baseline", marginTop: 10 }}>
              <View style={{ width: "20%" }}>
                <Text style={{ fontSize: 12 }}>For the month of</Text>
              </View>
              <View style={{ width: "80%", flexDirection: "row", borderBottomWidth: 1, borderBottomColor: '#000', borderBottomStyle: 'solid' }}>
                {/* ✅ FIXED: Changed weight to bold and added slight left padding to guarantee character layout safety */}
                <Text style={{ alignContent: "center", fontSize: 18, fontWeight: "bold", paddingLeft: 4 }}>
                  {month + " " + year}
                </Text>
              </View>
            </View>

            <View style={{ width: "100%", flexDirection: "row", alignItems: "baseline", marginTop: 10 }}>
              <View style={{ width: "70%" }}>
                <Text style={{ fontSize: 12 }}>Official hours for arrival and departure</Text>
              </View>
              <View style={{ width: "30%", flexDirection: "row", alignItems: "baseline" }}>
                <View style={{ width: "60%", textAlign: "right", paddingRight: 8, margin: 0 }}>
                  <Text style={{ fontSize: 12 }}>Regular Days</Text>
                </View>
                <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', borderBottomStyle: 'solid', width: "40%" }}>
                  <Text style={{ fontSize: 14, textAlign: "center" }}>{regularDayCount}</Text>
                </View>
              </View>
            </View>

            <View style={{ width: "30%", flexDirection: "row", alignSelf: "flex-end" }}>
              <View style={{ width: "60%", alignItems: "flex-end", textAlign: "right", paddingRight: 8, margin: 0 }}>
                <Text style={{ fontSize: 12 }}>Saturdays</Text>
              </View>
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', borderBottomStyle: 'solid', width: "40%", alignItems: "center" }}>
                <Text style={{ fontSize: 14, textAlign: "center" }}>{saturdayCount}</Text>
              </View>
            </View>
          </View>

          <View style={{ display: "flex", fontSize: 12, flexDirection: "row", flexBasis: "auto", width: "100%", paddingHorizontal: 15, alignContent: "stretch" }}>
            <View style={{ width: "8%", display: "flex", alignItems: "baseline", borderWidth: 1.5, borderColor: '#000', borderStyle: 'solid', margin: 0, fontSize: 12, textAlign: "center" }}>
              <Text>{"\n"}</Text>
              <Text> DATE </Text>
            </View>
            <View style={{ flexDirection: "column", width: "34%" }}>
              <View style={styles.tableBorderHeader1}>
                <Text> A.M. </Text>
              </View>
              <View style={{ flexDirection: "row", padding: 0, margin: 0 }}>
                <View style={styles.tableBorderHeader2}>
                  <Text> ARRIVAL </Text>
                </View>
                <View style={styles.tableBorderHeader2}>
                  <Text> DEPARTURE </Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "column", width: "34%" }}>
              <View style={styles.tableBorderHeader1}>
                <Text> P.M. </Text>
              </View>
              <View style={{ flexDirection: "row", flexFlow: 2, flexBasis: "auto" }}>
                <View style={styles.tableBorderHeader2}>
                  <Text> ARRIVAL </Text>
                </View>
                <View style={styles.tableBorderHeader2}>
                  <Text> DEPARTURE </Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "column", width: "24%" }}>
              <View style={styles.tableBorderHeader1}>
                <Text> TOTAL TIME </Text>
              </View>
              <View style={{ flexDirection: "row", flexFlow: 2, flexBasis: "auto" }}>
                <View style={styles.tableBorderHeader2}>
                  <Text> HOURS </Text>
                </View>
                <View style={styles.tableBorderHeader2}>
                  <Text> MINUTES </Text>
                </View>
              </View>
            </View>
          </View>

          {/* DYNAMIC ROWS */}
          {processedData.map((dtr) => {
            return (
              <View key={dtr.dateId} style={{ fontSize: 14, display: "flex", flexDirection: "row", flexBasis: "auto", width: "100%", paddingHorizontal: 15, alignContent: "stretch" }}>
                
                <View style={{ fontSize: 15, fontWeight: "bold", width: "8%", borderWidth: 1.5, borderColor: '#000', borderStyle: 'solid', borderTopWidth: 0, textAlign: "center", paddingVertical: 1 }}>
                  <Text> {dtr.dateId} </Text>
                </View>
                
                <View style={{ fontSize: 15, width: "17%", borderWidth: 1.5, borderColor: '#000', borderStyle: 'solid', borderTopWidth: 0, borderLeftWidth: 0, textAlign: "center", paddingVertical: 1 }}>
                  <Text> {dtr.timeInAM} </Text>
                </View>
                
                <View style={{ fontSize: 15, width: "17%", borderWidth: 1.5, borderColor: '#000', borderStyle: 'solid', borderTopWidth: 0, borderLeftWidth: 0, textAlign: "center", paddingVertical: 1 }}>
                  <Text> {dtr.timeOutAM} </Text>
                </View>
                
                <View style={{ fontSize: 15, width: "17%", borderWidth: 1.5, borderColor: '#000', borderStyle: 'solid', borderTopWidth: 0, borderLeftWidth: 0, textAlign: "center", paddingVertical: 1 }}>
                  <Text> {dtr.timeInPM} </Text>
                </View>
                
                <View style={{ fontSize: 15, width: "17%", borderWidth: 1.5, borderColor: '#000', borderStyle: 'solid', borderTopWidth: 0, borderLeftWidth: 0, textAlign: "center", paddingVertical: 1 }}>
                  <Text> {dtr.timeOutPM} </Text>
                </View>
                
                <View style={{ fontSize: 15, width: "12%", borderWidth: 1.5, borderColor: '#000', borderStyle: 'solid', borderTopWidth: 0, borderLeftWidth: 0, textAlign: "center", paddingVertical: 1 }}>
                  <Text> {dtr.hours} </Text>
                </View>
                
                <View style={{ fontSize: 15, width: "12%", borderWidth: 1.5, borderColor: '#000', borderStyle: 'solid', borderTopWidth: 0, borderLeftWidth: 0, textAlign: "center", paddingVertical: 1 }}>
                  <Text> {dtr.minutes} </Text>
                </View>

              </View>
            );
          })}
          
          {/* Summary Row for Monthly Hours & Minutes */}
          <View style={{ fontSize: 14, display: "flex", flexDirection: "row", flexBasis: "auto", width: "100%", paddingHorizontal: 15, alignContent: "stretch" }}>
            <View style={{ fontSize: 15, fontWeight: "bold", width: "76%", borderWidth: 1.5, borderColor: '#000', borderStyle: 'solid', borderTopWidth: 0, textAlign: "right", paddingVertical: 1, paddingRight: 3 }}>
              <Text> TOTAL </Text>
            </View>
            {/* ✅ FIXED: Applied explicit font tracking weights to total hours metric */}
            <View style={{ fontSize: 15, fontWeight: "bold", width: "12%", borderWidth: 1.5, borderColor: '#000', borderStyle: 'solid', borderTopWidth: 0, borderLeftWidth: 0, textAlign: "center", paddingVertical: 1 }}>
              <Text> {grandHours} </Text>
            </View>
            {/* ✅ FIXED: Applied explicit font tracking weights to total minutes metric */}
            <View style={{ fontSize: 15, fontWeight: "bold", width: "12%", borderWidth: 1.5, borderColor: '#000', borderStyle: 'solid', borderTopWidth: 0, borderLeftWidth: 0, textAlign: "center", paddingVertical: 1 }}>
              <Text> {grandMinutes} </Text>
            </View>
          </View>

          <View style={{ position: "absolute", bottom: 8, marginHorizontal: 15, alignSelf: "center" }}>
            <View style={{ borderWidth: 1, borderColor: '#000', borderStyle: 'solid', marginHorizontal: 30, marginVertical: 20 }}>
              <Text></Text>
            </View>
            <View style={{ borderWidth: 1, borderColor: '#000', borderStyle: 'solid', marginHorizontal: 30, marginBottom: 5 }}>
              <Text></Text>
            </View>
            <View style={{ fontSize: 12, fontStyle: "italic", textAlign: "justify" }}>
              <Text>
                {"          "} I Hereby CERTIFY on my honor that the above is a true and correct
                report of the hours of work performed, record of which was made
                daily at time of arrival and departure from office.
              </Text>
            </View>

            <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', borderBottomStyle: 'solid', width: "60%", alignSelf: "flex-end", fontSize: 14, fontWeight: "bold", textAlign: "center", marginVertical: 10 }}>
              <Text>{fullName}</Text>
            </View>

            <View style={{ borderWidth: 1, borderColor: '#000', borderStyle: 'solid', marginHorizontal: 30, marginVertical: 10 }}>
              <Text></Text>
            </View>
            <View style={{ borderWidth: 1, borderColor: '#000', borderStyle: 'solid', marginHorizontal: 30, marginVertical: 10 }}>
              <Text></Text>
            </View>
            <View style={{ fontSize: 12 }}>
              <Text>VERIFIED as to the prescribed office hours, </Text>
            </View>
            <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', borderBottomStyle: 'solid', width: "60%", alignSelf: "flex-end", fontWeight: "bold", marginTop: 10 }}>
              <Text></Text>
            </View>
            <View style={{ borderBottomWidth: 1, borderBottomColor: '#000', borderBottomStyle: 'solid', width: "60%", alignSelf: "flex-end", fontWeight: "bold", marginTop: 75, marginBottom: 0 }}>
              <Text></Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1a1d24] w-full max-w-4xl rounded-xl shadow-2xl flex flex-col h-[95vh] border border-gray-700 overflow-hidden">
        
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-[#23272f]">
          <div className="flex items-center space-x-2 text-white">
            <Printer className="h-5 w-5 text-blue-400" />
            <span className="font-semibold tracking-wide">Print Preview - Form 48</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 transition-all">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 bg-gray-500">
          <PDFViewer width="100%" height="100%" showToolbar={true}>
            <DTRDocument />
          </PDFViewer>
        </div>
      </div>
    </div>
  );
}