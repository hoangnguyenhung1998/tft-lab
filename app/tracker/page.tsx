import { PageTitle } from "@/components/ui/Panel";
import { Tracker } from "@/components/tracker/Tracker";
export const metadata={title:"Nhật ký trận đấu"};
export default function TrackerPage(){return <div><PageTitle lede="Ghi trận thủ công, theo dõi lỗi và xuất dữ liệu lưu trong trình duyệt.">Nhật ký trận đấu</PageTitle><Tracker/></div>}
